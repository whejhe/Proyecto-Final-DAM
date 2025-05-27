import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, FlatList, Pressable } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
// Importar Slider si decides usarlo para votar (ej. @react-native-community/slider)
// import Slider from '@react-native-community/slider';

const Galeria = () => {
    const route = useRoute();
    const { concursoId } = route.params;
    const currentUser = FIREBASE_AUTH.currentUser;

    const [imagenesParticipantes, setImagenesParticipantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Estado para seguir los votos del usuario actual en la UI
    const [votosUsuario, setVotosUsuario] = useState({}); // { [imagenId]: votoDado }

    const fetchNombreUsuario = useCallback(async (userId) => {
        try {
            console.log(`fetchNombreUsuario: Intentando obtener nombre para userId: ${userId}`);
            const userDocRef = doc(FIRESTORE_DB, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                console.log(`fetchNombreUsuario: Datos para ${userId} (campo esperado 'name'):`, userData);
                return userData.name || 'Usuario Anónimo (campo \'name\' no encontrado o vacío)';
            } else {
                console.log(`fetchNombreUsuario: No se encontró documento para userId: ${userId}`);
                return 'Usuario Desconocido (documento no encontrado)';
            }
        } catch (e) {
            console.error("Error obteniendo nombre de usuario: ", e);
            return 'Error Usuario (excepción en fetch)';
        }
    }, []);

    useEffect(() => {
        const fetchImagenes = async () => {
            if (!concursoId) {
                setError('ID de concurso no proporcionado.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const participationsRef = collection(FIRESTORE_DB, 'participacionesConcurso');
                const qParticipation = query(participationsRef, where('concursoId', '==', concursoId));
                const participationSnapshot = await getDocs(qParticipation);

                const todasLasImagenes = [];
                const votosUserActual = {};

                for (const participationDoc of participationSnapshot.docs) {
                    const participationData = participationDoc.data();
                    console.log(`fetchImagenes: Procesando participación del userId: ${participationData.userId}`);
                    const nombreUsuario = await fetchNombreUsuario(participationData.userId);
                    console.log(`fetchImagenes: Nombre obtenido para ${participationData.userId}: ${nombreUsuario}`);
                    
                    if (participationData.imagenes) {
                        for (const slotKey of Object.keys(participationData.imagenes)) {
                            const imagenInfo = participationData.imagenes[slotKey];
                            if (imagenInfo && imagenInfo.url) {
                                const imagenId = `${participationDoc.id}-${slotKey}`;
                                todasLasImagenes.push({
                                    id: imagenId,
                                    participationDocId: participationDoc.id, // Necesario para actualizar el voto
                                    url: imagenInfo.url,
                                    userIdDueño: participationData.userId, // Dueño de la imagen
                                    nombreUsuario: nombreUsuario,
                                    slot: slotKey,
                                    votosTotales: imagenInfo.votos || {}, // Votos de todos los usuarios para esta imagen
                                });
                                // Guardar el voto del usuario actual si existe
                                if (currentUser && imagenInfo.votos && imagenInfo.votos[currentUser.uid]) {
                                    votosUserActual[imagenId] = imagenInfo.votos[currentUser.uid];
                                }
                            }
                        }
                    }
                }
                setImagenesParticipantes(todasLasImagenes);
                setVotosUsuario(votosUserActual);
            } catch (e) {
                console.error("Error obteniendo imágenes de la galería: ", e);
                setError("No se pudieron cargar las imágenes de la galería.");
            } finally {
                setLoading(false);
            }
        };
        fetchImagenes();
    }, [concursoId, fetchNombreUsuario, currentUser]);

    const handleVotar = async (imagen) => {
        const { id: imagenId, participationDocId, slot, userIdDueño, votosTotales } = imagen;
        const voto = votosUsuario[imagenId];

        if (!currentUser) {
            Toast.show({ type: 'error', text1: 'Autenticación requerida', text2: 'Debes iniciar sesión para votar.' });
            return;
        }
        if (currentUser.uid === userIdDueño) {
            Toast.show({ type: 'info', text1: 'Acción no permitida', text2: 'No puedes votar por tus propias fotos.' });
            return;
        }
        if (voto === undefined || voto === null) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Selecciona una puntuación para votar.' });
            return;
        }

        Toast.show({ type: 'info', text1: 'Procesando', text2: 'Guardando tu voto...' });

        try {
            const participationDocRef = doc(FIRESTORE_DB, 'participacionesConcurso', participationDocId);
            const votePath = `imagenes.${slot}.votos.${currentUser.uid}`;
            
            await updateDoc(participationDocRef, {
                [votePath]: voto
            });

            setImagenesParticipantes(prev => prev.map(img => 
                img.id === imagenId 
                ? { ...img, votosTotales: { ...img.votosTotales, [currentUser.uid]: voto } } 
                : img
            ));

            Toast.show({ type: 'success', text1: 'Voto registrado', text2: `Has votado con ${voto} puntos.` });

        } catch (e) {
            console.error("Error al registrar el voto: ", e);
            Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo registrar tu voto.' });
            setVotosUsuario(prev => ({...prev, [imagenId]: votosTotales[currentUser.uid] || null })); 
        }
    };

    // Función para manejar la selección de un botón de voto
    const seleccionarVoto = (imagenId, userIdDueño, valorVoto) => {
        if (!currentUser) {
            Toast.show({ type: 'error', text1: 'Autenticación requerida', text2: 'Debes iniciar sesión para votar.' });
            return;
        }
        if (currentUser.uid === userIdDueño) {
            // No mostrar Toast aquí si solo se previene la acción, se informará al intentar votar.
            return;
        }
        setVotosUsuario(prev => ({
            ...prev,
            [imagenId]: prev[imagenId] === valorVoto ? null : valorVoto
        }));
    };

    const renderItemImagen = ({ item }) => {
        const esPropiaFoto = currentUser && item.userIdDueño === currentUser.uid;
        const votoActualUsuarioParaImagen = votosUsuario[item.id];

        return (
            <View style={styles.imagenContainer}>
                <Image source={{ uri: item.url }} style={styles.imagen} />
                <Text style={styles.nombreUsuario}>Subida por: {item.nombreUsuario}</Text>
                
                {esPropiaFoto ? (
                    <Text style={styles.infoPropiaFoto}>No puedes votar por tu propia foto.</Text>
                ) : (
                    <View style={styles.votacionContainer}>
                        <Text style={styles.votacionTitulo}>Tu voto (1-10):</Text>
                        <View style={styles.botonesVotoContainer}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(valor => (
                                <Pressable 
                                    key={valor} 
                                    style={[
                                        styles.botonVoto,
                                        votoActualUsuarioParaImagen === valor && styles.botonVotoSeleccionado
                                    ]} 
                                    onPress={() => seleccionarVoto(item.id, item.userIdDueño, valor)}
                                >
                                    <Text 
                                        style={[
                                            styles.botonVotoTexto,
                                            votoActualUsuarioParaImagen === valor && styles.botonVotoTextoSeleccionado
                                        ]}
                                    >
                                        {valor}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                        {votoActualUsuarioParaImagen !== null && votoActualUsuarioParaImagen !== undefined && (
                            <Pressable style={styles.confirmarVotoButton} onPress={() => handleVotar(item)}>
                                <Text style={styles.confirmarVotoButtonText}>Confirmar Voto: {votoActualUsuarioParaImagen}</Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Cargando galería...</Text></View>;
    }

    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    if (imagenesParticipantes.length === 0) {
        return <View style={styles.centered}><Text>No hay imágenes en esta galería todavía.</Text></View>;
    }

    return (
        <FlatList
            data={imagenesParticipantes}
            renderItem={renderItemImagen}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            extraData={votosUsuario} // Asegurar re-renderizado cuando cambian los votos del usuario
        />
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    listContainer: {
        padding: 10,
        paddingBottom: 20,
    },
    imagenContainer: {
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 15,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    imagen: {
        width: '100%',
        aspectRatio: 16 / 9,
        resizeMode: 'cover',
        borderRadius: 8,
        marginBottom: 12,
    },
    nombreUsuario: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    infoPropiaFoto: {
        textAlign: 'center',
        color: '#757575',
        fontSize: 15,
        paddingVertical: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 6,
    },
    votacionContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    votacionTitulo: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 10,
        color: '#444',
    },
    botonesVotoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    botonVoto: {
        backgroundColor: '#e9ecef',
        paddingVertical: 10,
        paddingHorizontal: 0,
        borderRadius: 20,
        margin: 4,
        minWidth: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ced4da',
    },
    botonVotoSeleccionado: {
        backgroundColor: '#007bff',
        borderColor: '#0056b3',
    },
    botonVotoTexto: {
        color: '#212529',
        fontSize: 15,
        fontWeight: 'bold',
    },
    botonVotoTextoSeleccionado: {
        color: 'white',
    },
    confirmarVotoButton: {
        backgroundColor: '#28a745',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    confirmarVotoButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default Galeria;

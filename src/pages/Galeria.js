import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, FlatList, Pressable, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
// Importar Slider si decides usarlo para votar (ej. @react-native-community/slider)
// import Slider from '@react-native-community/slider';

const MIN_VOTOS_REQUERIDOS = 10; // Definir el mínimo de votos requeridos

const Galeria = () => {
    const route = useRoute();
    const { concursoId } = route.params;
    const currentUser = FIREBASE_AUTH.currentUser;

    const [imagenesParticipantes, setImagenesParticipantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Estado para seguir los votos del usuario actual en la UI
    const [votosUsuario, setVotosUsuario] = useState({}); // { [imagenId]: votoDado }
    const [estadoConcurso, setEstadoConcurso] = useState(null); // Nuevo estado para el estado del concurso
    const [nombresUsuarios, setNombresUsuarios] = useState({}); // Para cachear nombres
    const [userVotingStats, setUserVotingStats] = useState({ distinctImagesVotedCount: 0, imagesVotedSet: {} }); // Para el feedback al usuario

    const fetchEstadoConcurso = useCallback(async () => {
        if (!concursoId) return;
        setLoading(true); // Podrías tener un indicador de carga específico para el estado
        try {
            const concursoRef = doc(FIRESTORE_DB, 'concursos', concursoId);
            const concursoSnap = await getDoc(concursoRef);
            if (concursoSnap.exists()) {
                setEstadoConcurso(concursoSnap.data().estado);
                console.log("[Galeria] Estado del concurso cargado:", concursoSnap.data().estado);
            } else {
                console.log("[Galeria] No se encontró el concurso para obtener el estado.");
                setEstadoConcurso('desconocido');
                Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cargar la información del concurso.' });
            }
        } catch (error) {
            console.error("[Galeria] Error fetching contest status: ", error);
            setEstadoConcurso('desconocido');
            Toast.show({ type: 'error', text1: 'Error', text2: 'Error al cargar estado del concurso.' });
        }
        // setLoading(false) // Lo controla el fetchImagenes general
    }, [concursoId]);

    const fetchUserVotingStats = useCallback(async () => {
        if (!currentUser || !concursoId) return;
        try {
            const statsRef = doc(FIRESTORE_DB, `userContestVotingStats/${currentUser.uid}/contestsVoted/${concursoId}`);
            const statsSnap = await getDoc(statsRef);
            if (statsSnap.exists()) {
                setUserVotingStats(statsSnap.data());
            } else {
                setUserVotingStats({ distinctImagesVotedCount: 0, imagesVotedSet: {} });
            }
        } catch (error) {
            console.error("[Galeria] Error fetching user voting stats: ", error);
            setUserVotingStats({ distinctImagesVotedCount: 0, imagesVotedSet: {} });
        }
    }, [currentUser, concursoId]);

    const fetchNombreUsuario = useCallback(async (userId) => {
        if (nombresUsuarios[userId]) return nombresUsuarios[userId]; // Devuelve desde caché si existe
        try {
            const userRef = doc(FIRESTORE_DB, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const nombre = userSnap.data().name || "Usuario Anónimo";
                setNombresUsuarios(prev => ({ ...prev, [userId]: nombre }));
                return nombre;
            }
            return "Usuario Anónimo";
        } catch (error) {
            console.error("Error fetching user name: ", error);
            return "Usuario Anónimo";
        }
    }, [nombresUsuarios]);

    const fetchImagenesYParticipantes = useCallback(async () => {
        if (!concursoId) return;
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
    }, [concursoId, fetchNombreUsuario, currentUser]);

    useEffect(() => {
        fetchEstadoConcurso();
        fetchImagenesYParticipantes();
        if (currentUser) {
            fetchUserVotingStats();
        }
    }, [concursoId, currentUser, fetchEstadoConcurso, fetchImagenesYParticipantes, fetchUserVotingStats]);

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

        if (estadoConcurso !== 'en votacion') {
            Toast.show({
                type: 'info',
                text1: 'Votación No Activa',
                text2: 'El período de votación para este concurso no está activo.',
            });
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

            // Actualizar estadísticas de votación del usuario
            const userStatsRef = doc(FIRESTORE_DB, `userContestVotingStats/${currentUser.uid}/contestsVoted/${concursoId}`);
            
            // Usamos una transacción o un get + set para asegurar consistencia si múltiples votos ocurren rápido,
            // pero para simplificar, un get y luego set/update es común.
            const statsSnap = await getDoc(userStatsRef);
            let currentImagesVotedSet = statsSnap.exists() ? statsSnap.data().imagesVotedSet || {} : {};
            
            const imageUniqueIdForStats = `${participationDocId}_${slot}`;
            let newDistinctCount = userVotingStats.distinctImagesVotedCount; // Tomar del estado para la UI

            if (!currentImagesVotedSet[imageUniqueIdForStats]) { // Si es la primera vez que vota ESTA imagen
                newDistinctCount = (statsSnap.exists() ? statsSnap.data().distinctImagesVotedCount || 0 : 0) + 1;
                currentImagesVotedSet[imageUniqueIdForStats] = true; 
                
                await setDoc(userStatsRef, {
                    distinctImagesVotedCount: newDistinctCount,
                    imagesVotedSet: currentImagesVotedSet,
                    lastVotedTimestamp: serverTimestamp()
                }, { merge: true });
                
                setUserVotingStats({ distinctImagesVotedCount: newDistinctCount, imagesVotedSet: currentImagesVotedSet });

                if (newDistinctCount < MIN_VOTOS_REQUERIDOS) {
                    Toast.show({type: 'success', text1: 'Voto Registrado', text2: `Te faltan ${MIN_VOTOS_REQUERIDOS - newDistinctCount} votos distintos para que tus votos cuenten.`});
                } else {
                    Toast.show({type: 'success', text1: 'Voto Registrado', text2: '¡Has alcanzado el mínimo de votos distintos requeridos!'});
                }
            } else {
                 // Si ya votó esta imagen, solo se actualizó el voto en la imagen. El conteo de distintos no cambia.
                 // Podríamos actualizar el `lastVotedTimestamp`
                await updateDoc(userStatsRef, { lastVotedTimestamp: serverTimestamp() });
                Toast.show({type: 'success', text1: 'Voto Actualizado', text2: `Tu voto para esta imagen ha sido actualizado.`});
            }

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
        if (estadoConcurso !== 'en votacion') {
            Toast.show({
                type: 'info',
                text1: 'Votación No Activa',
                text2: 'El período de votación para este concurso no está activo.',
            });
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
        const puedeVotarEnGeneral = estadoConcurso === 'en votacion';

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
                {!puedeVotarEnGeneral && (
                    <Text style={styles.infoText}>La votación para este concurso no está activa actualmente.</Text>
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
    },
    infoText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
        paddingVertical: 10,
    }
});

export default Galeria;

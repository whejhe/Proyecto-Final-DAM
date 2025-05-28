import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // serverTimestamp añadido
import Toast from 'react-native-toast-message';
import { isAdmin } from '../services/authService'; // IMPORTADO
import { deleteImageFromImgbb } from '../services/imageService'; // IMPORTADO

const MIN_VOTOS_REQUERIDOS = 10; // Definir el mínimo de votos requeridos

const { width: screenWidth } = Dimensions.get('window'); // Definir screenWidth aquí

const Galeria = () => {
    const route = useRoute();
    const { concursoId } = route.params;
    
    const [imagenesParticipantes, setImagenesParticipantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [votosUsuario, setVotosUsuario] = useState({}); 
    const [currentUser, setCurrentUser] = useState(null);
    const [estadoConcurso, setEstadoConcurso] = useState(null);
    const [nombresUsuarios, setNombresUsuarios] = useState({});
    const [userVotingStats, setUserVotingStats] = useState({ distinctImagesVotedCount: 0, imagesVotedSet: {} }); // Para el feedback al usuario
    const [isAdminUser, setIsAdminUser] = useState(false); // NUEVO ESTADO
    const [error, setError] = useState(null);

    useEffect(() => {
        const user = FIREBASE_AUTH.currentUser;
        setCurrentUser(user);
    }, []);

    // Efecto para determinar si el usuario es admin
    useEffect(() => {
        const checkAdmin = async () => {
            if (currentUser) {
                const adminStatus = await isAdmin(currentUser.uid);
                setIsAdminUser(adminStatus);
            } else {
                setIsAdminUser(false); // Asegurarse de que no es admin si no hay currentUser
            }
        };
        checkAdmin();
    }, [currentUser]);

    const fetchEstadoConcurso = useCallback(async () => {
        if (!concursoId) return;
        // setLoading(true); // Se controla por el fetch general
        try {
            const concursoRef = doc(FIRESTORE_DB, 'concursos', concursoId);
            const concursoSnap = await getDoc(concursoRef);
            if (concursoSnap.exists()) {
                setEstadoConcurso(concursoSnap.data().estado);
            } else {
                setEstadoConcurso('desconocido');
                Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cargar la información del concurso.' });
            }
        } catch (error) {
            console.error("[Galeria] Error fetching contest status: ", error);
            setEstadoConcurso('desconocido');
        }
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
        if (nombresUsuarios[userId]) return nombresUsuarios[userId];
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
        // setLoading y setError se manejarán en el flujo de llamada principal
        try {
            const participationsRef = collection(FIRESTORE_DB, 'participacionesConcurso');
            const qParticipation = query(participationsRef, where('concursoId', '==', concursoId));
            const participationSnapshot = await getDocs(qParticipation);

            let procesadasImagenes = []; // Renombrado para claridad
            const votosUserActual = {};

            for (const participationDoc of participationSnapshot.docs) {
                const participationData = participationDoc.data();
                const nombreUsuario = await fetchNombreUsuario(participationData.userId);
                
                if (participationData.imagenes) {
                    for (const slotKey of Object.keys(participationData.imagenes)) {
                        const imagenInfo = participationData.imagenes[slotKey];
                        if (imagenInfo && imagenInfo.url) {
                            if (!isAdminUser && imagenInfo.estadoImagen !== 'aprobada') {
                                continue; 
                            }
                            const imagenId = `${participationDoc.id}-${slotKey}`;
                            procesadasImagenes.push({
                                id: imagenId,
                                participationDocId: participationDoc.id,
                                url: imagenInfo.url,
                                delete_url: imagenInfo.delete_url || null, 
                                estadoImagen: imagenInfo.estadoImagen || 'pendiente', 
                                userIdDueño: participationData.userId,
                                nombreUsuario: nombreUsuario,
                                slot: slotKey,
                                votosTotales: imagenInfo.votos || {},
                            });
                            if (currentUser && imagenInfo.votos && imagenInfo.votos[currentUser.uid]) {
                                votosUserActual[imagenId] = imagenInfo.votos[currentUser.uid];
                            }
                        }
                    }
                }
            }
            setImagenesParticipantes(procesadasImagenes); // CORREGIDO: usar setImagenesParticipantes
            setVotosUsuario(votosUserActual);
            // setError(''); // Limpiar errores previos si la carga es exitosa
        } catch (e) {
            console.error("Error obteniendo imágenes de la galería: ", e);
            setError("No se pudieron cargar las imágenes de la galería.");
            setImagenesParticipantes([]); // Limpiar imágenes en caso de error
        } 
    }, [concursoId, fetchNombreUsuario, currentUser, isAdminUser]);

    // useEffect para la carga de datos principal (estado del concurso, rol de admin, stats de votos)
    useEffect(() => {
        const cargarDatosEsenciales = async () => {
            setLoading(true); // Inicia carga general
            setError(null); 

            if (!concursoId) {
                setError("ID de concurso no proporcionado.");
                setLoading(false);
                return;
            }
            try {
                await fetchEstadoConcurso(); // Carga el estado del concurso

                if (currentUser) {
                    const adminStatus = await isAdmin(currentUser.uid);
                    setIsAdminUser(adminStatus); // Esto disparará el siguiente useEffect si cambia
                    await fetchUserVotingStats(); // Carga las estadísticas de voto del usuario
                } else {
                    setIsAdminUser(false); // Si no hay usuario, no es admin
                    // fetchImagenesYParticipantes se llamará igualmente en el siguiente hook
                    // y filtrará imágenes si es necesario (ej. solo aprobadas para público)
                }
            } catch (e) {
                console.error("[Galeria] Error en carga esencial: ", e);
                setError("Error al cargar datos esenciales de la galería.");
                setLoading(false); // Detener carga si hay error en datos esenciales
            }
            // No ponemos setLoading(false) aquí porque la carga de imágenes sigue
        };
        
        cargarDatosEsenciales();
    }, [concursoId, currentUser, fetchEstadoConcurso, fetchUserVotingStats]); // Dependencias para recargar estos datos

    // useEffect dedicado a cargar las imágenes una vez que isAdminUser está resuelto
    // y también si cambia el usuario (para recargar con/sin filtro admin)
    // o si cambia el concursoId.
    useEffect(() => {
        // Proceder solo si concursoId está disponible y el estado de autenticación (currentUser) se ha determinado
        if (concursoId && typeof currentUser !== 'undefined') { 
            setLoading(true); // Indicar carga para las imágenes (puede solaparse o seguir a la anterior)
            setError(null);   // Limpiar errores antes de (re)cargar imágenes
            
            fetchImagenesYParticipantes() // Esta función debe manejar su propio try/catch y puede llamar a setError
                .finally(() => {
                    setLoading(false); // Finalizar TODA la carga después de obtener imágenes (o fallar)
                });
        }
    }, [isAdminUser, currentUser, concursoId, fetchImagenesYParticipantes]); // Dependencias para recargar imágenes

    const handleActualizarEstadoImagen = async (imagen, nuevoEstado) => {
        if (!isAdminUser) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Acción no permitida.' });
            return;
        }
        try {
            Toast.show({ type: 'info', text1: 'Actualizando...', text2: `Marcando imagen como ${nuevoEstado}` });
            const participationDocRef = doc(FIRESTORE_DB, 'participacionesConcurso', imagen.participationDocId);
            const updatePath = `imagenes.${imagen.slot}.estadoImagen`;
            
            await updateDoc(participationDocRef, {
                [updatePath]: nuevoEstado
            });

            if (nuevoEstado === 'rechazada' && imagen.delete_url) {
                await deleteImageFromImgbb(imagen.delete_url); 
            }

            setImagenesParticipantes(prev => prev.map(img => 
                img.id === imagen.id 
                ? { ...img, estadoImagen: nuevoEstado } 
                : img
            ));
            Toast.show({ type: 'success', text1: 'Éxito', text2: `Imagen marcada como ${nuevoEstado}.` });

        } catch (error) {
            console.error(`Error al cambiar estado a ${nuevoEstado}: `, error);
            Toast.show({ type: 'error', text1: 'Error', text2: `No se pudo actualizar el estado.` });
        }
    };
    
    const handleVotar = async (imagen) => {
        const { id: imagenId, participationDocId, slot, userIdDueño, votosTotales } = imagen;
        const voto = votosUsuario[imagenId]; // Obtener el voto pendiente del estado local

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
            
            await updateDoc(participationDocRef, { [votePath]: voto });

            setImagenesParticipantes(prev => prev.map(img => 
                img.id === imagenId 
                ? { ...img, votosTotales: { ...(img.votosTotales || {}), [currentUser.uid]: voto } } 
                : img
            ));
            // Lógica de userVotingStats ... (la mantenemos como estaba)
            const userStatsRef = doc(FIRESTORE_DB, `userContestVotingStats/${currentUser.uid}/contestsVoted/${concursoId}`);
            const statsSnap = await getDoc(userStatsRef);
            let currentImagesVotedSet = statsSnap.exists() ? statsSnap.data().imagesVotedSet || {} : {};
            const imageUniqueIdForStats = `${participationDocId}_${slot}`;
            let newDistinctCount = userVotingStats.distinctImagesVotedCount;

            if (!currentImagesVotedSet[imageUniqueIdForStats]) {
                newDistinctCount = (statsSnap.exists() ? statsSnap.data().distinctImagesVotedCount || 0 : 0) + 1;
                currentImagesVotedSet[imageUniqueIdForStats] = true; 
                await setDoc(userStatsRef, {
                    distinctImagesVotedCount: newDistinctCount,
                    imagesVotedSet: currentImagesVotedSet,
                    lastVotedTimestamp: serverTimestamp()
                }, { merge: true });
                setUserVotingStats({ distinctImagesVotedCount: newDistinctCount, imagesVotedSet: currentImagesVotedSet });
                if (newDistinctCount < MIN_VOTOS_REQUERIDOS) {
                    Toast.show({type: 'success', text1: 'Voto Registrado', text2: `Te faltan ${MIN_VOTOS_REQUERIDOS - newDistinctCount} votos distintos.`});
                } else {
                    Toast.show({type: 'success', text1: 'Voto Registrado', text2: '¡Mínimo de votos alcanzado!'});
                }
            } else {
                await updateDoc(userStatsRef, { lastVotedTimestamp: serverTimestamp() });
                Toast.show({type: 'success', text1: 'Voto Actualizado', text2: `Tu voto ha sido actualizado.`});
            }
        } catch (e) {
            console.error("Error al registrar el voto: ", e);
            Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo registrar tu voto.' });
            // Revertir el voto en la UI si falla el guardado es complejo, 
            // por ahora el estado local de votosUsuario[imagenId] no se revierte aquí.
        }
    };

    // Función para manejar la selección de un botón de voto (actualiza estado local)
    const seleccionarVoto = (imagenId, userIdDueño, valorVoto) => {
        if (!currentUser) {
            Toast.show({ type: 'error', text1: 'Autenticación requerida', text2: 'Debes iniciar sesión para votar.' });
            return;
        }
        if (currentUser.uid === userIdDueño) {
            return; // Ya se informa al intentar enviar el voto
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
            [imagenId]: prev[imagenId] === valorVoto ? null : valorVoto // Permite deseleccionar
        }));
    };

    const renderItemImagen = ({ item }) => {
        const esPropiaFoto = currentUser && item.userIdDueño === currentUser.uid;
        const votoActualUsuarioParaImagen = votosUsuario[item.id];
        const puedeVotarEnGeneral = estadoConcurso === 'en votacion';

        let estadoParaMostrarAdmin = '';
        let colorEstadoAdmin = '#888';

        if (isAdminUser) {
            switch (item.estadoImagen) {
                case 'pendiente':
                    estadoParaMostrarAdmin = 'Pendiente de Validación';
                    colorEstadoAdmin = 'orange';
                    break;
                case 'aprobada':
                    estadoParaMostrarAdmin = 'Aprobada';
                    colorEstadoAdmin = 'green';
                    break;
                case 'rechazada':
                    estadoParaMostrarAdmin = 'Rechazada';
                    colorEstadoAdmin = 'red';
                    break;
                default:
                    estadoParaMostrarAdmin = 'Estado Desconocido';
            }
        }
        // Para no administradores, las imágenes ya vienen filtradas (solo aprobadas).
        // Si es admin, se muestran todas y se indica su estado.
        // Si no es admin y la imagen no está aprobada, no debería llegar aquí debido al filtro en fetchImagenesYParticipantes.
        if (!isAdminUser && item.estadoImagen !== 'aprobada') {
            return null; // No renderizar si no está aprobada y no es admin (doble seguro)
        }

        return (
            <View style={[
                styles.imagenContainer,
                isAdminUser && item.estadoImagen === 'pendiente' && styles.imagenPendienteAdminBorder,
                isAdminUser && item.estadoImagen === 'rechazada' && styles.imagenRechazadaAdminBorder
            ]}>
                <Image source={{ uri: item.url }} style={styles.imagen} />
                <Text style={styles.nombreUsuario}>Subida por: {item.nombreUsuario}</Text>
                
                {isAdminUser && (
                    <View style={styles.adminInfoContainer}>
                        <Text style={[styles.estadoImagenTexto, { color: colorEstadoAdmin }]}>
                            Estado: {estadoParaMostrarAdmin}
                        </Text>
                        <View style={styles.adminBotonesWrapper}>
                            {(item.estadoImagen === 'pendiente' || item.estadoImagen === 'rechazada') && (
                                <Pressable 
                                    style={[styles.adminBoton, styles.adminBotonAprobar]} 
                                    onPress={() => handleActualizarEstadoImagen(item, 'aprobada')}>
                                    <Text style={styles.adminBotonTexto}>Aprobar</Text>
                                </Pressable>
                            )}
                            {(item.estadoImagen === 'pendiente' || item.estadoImagen === 'aprobada') && (
                                <Pressable 
                                    style={[styles.adminBoton, styles.adminBotonRechazar]} 
                                    onPress={() => handleActualizarEstadoImagen(item, 'rechazada')}>
                                    <Text style={styles.adminBotonTexto}>Rechazar</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                )}

                {/* Solo permitir votar imágenes aprobadas (o todas si es admin y el concurso está en votación) */}
                { (item.estadoImagen === 'aprobada' || isAdminUser) && puedeVotarEnGeneral && !esPropiaFoto && (
                    <View style={styles.votacionContainer}>
                        <Text style={styles.votacionPrompt}>Tu Voto (1-10):</Text>
                        <View style={styles.botonesVotoRow}>
                            {[...Array(10).keys()].map(i => {
                                const puntuacion = i + 1;
                                return (
                                    <Pressable
                                        key={puntuacion}
                                        style={[
                                            styles.botonVoto,
                                            votoActualUsuarioParaImagen === puntuacion && styles.botonVotoSeleccionado
                                        ]}
                                        onPress={() => seleccionarVoto(item.id, item.userIdDueño, puntuacion)}
                                    >
                                        <Text style={styles.textoBotonVoto}>{puntuacion}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Pressable 
                            style={[
                                styles.confirmarVotoButton, 
                                (votoActualUsuarioParaImagen === undefined || votoActualUsuarioParaImagen === null) && styles.confirmarVotoButtonDisabled
                            ]}
                            onPress={() => handleVotar(item)}
                            disabled={votoActualUsuarioParaImagen === undefined || votoActualUsuarioParaImagen === null}
                        >
                            <Text style={styles.confirmarVotoText}>Confirmar Voto</Text>
                        </Pressable>
                    </View>
                )}
                {esPropiaFoto && puedeVotarEnGeneral && (
                    <Text style={styles.infoText}>No puedes votar por tus propias fotos.</Text>
                )}
                {!puedeVotarEnGeneral && (
                    <Text style={styles.infoText}>La votación para este concurso no está activa actualmente.</Text>
                )}
            </View>
        );
    };

    const noHayImagenesTexto = isAdminUser 
        ? "No hay imágenes en esta galería, o ninguna cumple los filtros para administradores."
        : "No hay imágenes aprobadas en esta galería todavía.";

    if (loading && imagenesParticipantes.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="tomato" />
                <Text>Cargando galería...</Text>
            </View>
        );
    }
    
    if (!loading && imagenesParticipantes.length === 0 && estadoConcurso) { // Solo mostrar si el estado ya se cargó
        return (
            <View style={styles.centered}>
                <Text style={styles.title}>Galería del Concurso</Text>
                <Text>{noHayImagenesTexto}</Text>
                {estadoConcurso === 'pendiente' && <Text>El concurso aún no ha comenzado.</Text>}
                {estadoConcurso === 'activo' && <Text>El concurso está activo, ¡esperando las primeras fotos!</Text>}
            </View>
        );
    }
    
    return (
        <FlatList
            data={imagenesParticipantes}
            renderItem={renderItemImagen}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.container}
            ListHeaderComponent={
                <View>
                    <Text style={styles.title}>Galería del Concurso</Text>
                    {currentUser && estadoConcurso === 'en votacion' && (
                        <Text style={styles.votingProgressText}>
                            Has votado por {userVotingStats.distinctImagesVotedCount || 0} de {MIN_VOTOS_REQUERIDOS} imágenes distintas requeridas.
                            { (userVotingStats.distinctImagesVotedCount || 0) >= MIN_VOTOS_REQUERIDOS && " ¡Gracias por completar tus votos!"}
                        </Text>
                    )}
                     {currentUser && estadoConcurso === 'en votacion' && (userVotingStats.distinctImagesVotedCount || 0) < MIN_VOTOS_REQUERIDOS && (
                        <Text style={styles.infoTextSmall}>
                            Tus votos contarán para el ranking final cuando votes al menos {MIN_VOTOS_REQUERIDOS} imágenes diferentes.
                        </Text>
                    )}
                </View>
            }
            extraData={{ votosUsuario, userVotingStats, estadoConcurso }} // Añadir estadoConcurso
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
    container: {
        padding: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
        color: '#333',
    },
    participacionContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
    },
    imageOwnerText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555',
    },
    imageCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10, 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 1,
    },
    image: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 6,
        marginBottom: 8,
    },
    votacionContainer: {
        marginTop: 8,
        alignItems: 'center',
    },
    votacionPrompt: {
        fontSize: 14,
        color: '#444',
        marginBottom: 5,
    },
    botonesVotoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 10,
    },
    botonVoto: {
        backgroundColor: '#e9ecef',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 15,
        margin: 3,
        minWidth: 30, 
        alignItems: 'center',
        justifyContent: 'center',
    },
    textoBotonVoto: {
        fontSize: 13,
        color: '#333',
    },
    botonVotoSeleccionado: {
        backgroundColor: 'tomato',
    },
    confirmarVotoButton: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
    },
    confirmarVotoText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    },
    confirmarVotoButtonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
    infoText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        marginTop: 5,
        paddingVertical: 10, 
    },
    votingProgressText: {
        textAlign: 'center',
        fontSize: 15,
        color: '#007bff',
        marginBottom: 5,
        fontWeight: '500',
    },
    infoTextSmall: {
        textAlign: 'center',
        fontSize: 13,
        color: '#6c757d',
        marginBottom: 15,
        fontStyle: 'italic',
    },
    imagenContainer: {
        marginBottom: 25,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee'
    },
    imagenPendienteAdminBorder: { 
        borderColor: '#ffc107', // Amarillo bootstrap warning
        borderWidth: 3,
    },
    imagenRechazadaAdminBorder: {
        borderColor: '#dc3545', // Rojo bootstrap danger
        borderWidth: 3,
    },
    imagen: {
        width: '100%',
        height: screenWidth * 0.75, 
        resizeMode: 'cover',
        borderRadius: 8,
    },
    nombreUsuario: {
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
        fontSize: 16,
        color: '#333',
    },
    // Estilos para admin
    adminInfoContainer: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    estadoImagenTexto: {
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    adminBotonesWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5, // Añadir un pequeño margen superior
    },
    adminBoton: {
        paddingVertical: 10,
        paddingHorizontal: 12, // Un poco menos de padding horizontal para que quepan mejor
        borderRadius: 5,
        alignItems: 'center',
        flex: 1, // Para que los botones compartan espacio si están en la misma fila
        marginHorizontal: 4, // Espacio entre botones
        minHeight: 40, // Altura mínima
        justifyContent: 'center', // Centrar texto verticalmente
    },
    adminBotonAprobar: {
        backgroundColor: '#28a745', // Verde bootstrap success
    },
    adminBotonRechazar: {
        backgroundColor: '#dc3545', // Rojo bootstrap danger
    },
    adminBotonTexto: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Fin estilos Admin
});

export default Galeria;

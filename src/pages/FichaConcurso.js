import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';
import { isAdmin } from '../services/authService';

const FichaConcurso = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { concursoId, timestamp } = route.params;
    const [concurso, setConcurso] = useState(null);
    const [error, setError] = useState('');
    const [isUserSubscribed, setIsUserSubscribed] = useState(false);
    const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);

    const [userParticipation, setUserParticipation] = useState(null);
    const [isFetchingParticipation, setIsFetchingParticipation] = useState(false);
    const [isUploadingSlot, setIsUploadingSlot] = useState({ slot1: false, slot2: false, slot3: false });

    const currentUser = FIREBASE_AUTH.currentUser;

    const fetchUserParticipationData = useCallback(async () => {
        if (!currentUser || !concursoId) return;
        setIsFetchingParticipation(true);
        try {
            const participationsRef = collection(FIRESTORE_DB, 'participacionesConcurso');
            const q = query(participationsRef, where('concursoId', '==', concursoId), where('userId', '==', currentUser.uid));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const participationDoc = querySnapshot.docs[0];
                setUserParticipation({ id: participationDoc.id, ...participationDoc.data() });
            } else {
                setUserParticipation(null);
            }
        } catch (e) {
            console.error("Error al obtener datos de participación: ", e);
            setError("Error al cargar tus imágenes para este concurso.");
        }
        setIsFetchingParticipation(false);
    }, [currentUser, concursoId]);

    const cargarDatosConcurso = useCallback(async () => {
        if (!concursoId) return;
        console.log(`Cargando datos para concursoId: ${concursoId} (timestamp: ${timestamp}) en FichaConcurso`);
        setConcurso(null);
        setError('');
        try {
            const docRef = doc(FIRESTORE_DB, 'concursos', concursoId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const concursoData = docSnap.data();
                setConcurso(concursoData);
                if (currentUser && concursoData.usersId?.includes(currentUser.uid)) {
                    setIsUserSubscribed(true);
                } else {
                    setIsUserSubscribed(false);
                    setUserParticipation(null);
                }
            } else {
                setError("No se encontró el concurso");
            }
        } catch (e) {
            console.error("Error al obtener el concurso: ", e);
            setError("Error al obtener el concurso");
        }
    }, [concursoId, currentUser, timestamp]);

    useEffect(() => {
        if (isUserSubscribed && currentUser && concursoId) {
            fetchUserParticipationData();
        }
    }, [isUserSubscribed, currentUser, concursoId, fetchUserParticipationData]);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (currentUser) {
                const admin = await isAdmin(currentUser.uid);
                setIsAdminUser(admin);
            }
        };
        checkAdminStatus();
    }, [currentUser]);

    useFocusEffect(
        useCallback(() => {
            console.log('FichaConcurso screen is focused, reloading data.');
            cargarDatosConcurso();
            return () => {
                // console.log('FichaConcurso screen is unfocused');
            };
        }, [cargarDatosConcurso])
    );

    const handleToggleSubscription = async () => {
        if (isUpdatingSubscription) return;
        setIsUpdatingSubscription(true);
        setError('');

        if (!currentUser) {
            setError("Debes iniciar sesión para inscribirte.");
            setIsUpdatingSubscription(false);
            return;
        }

        try {
            const userId = currentUser.uid;
            const concursoRef = doc(FIRESTORE_DB, 'concursos', concursoId);
            let updatedUsersId;
            let nowSubscribed;

            if (isUserSubscribed) {
                await updateDoc(concursoRef, { usersId: arrayRemove(userId) });
                updatedUsersId = concurso.usersId.filter(id => id !== userId);
                nowSubscribed = false;
                Alert.alert('Realizado', 'Te has dado de baja del concurso.');
                setUserParticipation(null);
            } else {
                await updateDoc(concursoRef, { usersId: arrayUnion(userId) });
                updatedUsersId = [...(concurso.usersId || []), userId];
                nowSubscribed = true;
                Alert.alert('Éxito', 'Te has inscrito en el concurso correctamente.');
                fetchUserParticipationData();
            }
            
            setIsUserSubscribed(nowSubscribed);
            setConcurso(prevConcurso => ({
                ...prevConcurso,
                usersId: updatedUsersId
            }));

        } catch (e) {
            console.error("Error al actualizar la inscripción: ", e);
            setError("Error al actualizar la inscripción");
            Alert.alert('Error', 'No se pudo actualizar la inscripción.');
        } finally {
            setIsUpdatingSubscription(false);
        }
    };

    const handleImageUpload = async (slotKey) => {
        console.log(`Subir imagen para el slot: ${slotKey}`);
        if (!currentUser) {
            Alert.alert("Error", "Debes estar autenticado para subir imágenes.");
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true, 
            });

            if (result.canceled) return;

            const base64Img = result.assets[0].base64;
            if (!base64Img) {
                Alert.alert("Error", "No se pudo obtener la imagen en base64.");
                return;
            }

            setIsUploadingSlot(prev => ({ ...prev, [slotKey]: true }));
            const imageUrl = await uploadImageToImgbb(base64Img);
            setIsUploadingSlot(prev => ({ ...prev, [slotKey]: false }));

            if (!imageUrl) {
                Alert.alert("Error", "No se pudo subir la imagen a ImgBB.");
                return;
            }

            let participationDocRef;
            let currentData = {};

            if (userParticipation && userParticipation.id) {
                participationDocRef = doc(FIRESTORE_DB, 'participacionesConcurso', userParticipation.id);
                currentData = userParticipation.imagenes || {};
            } else {
                const participationsRef = collection(FIRESTORE_DB, 'participacionesConcurso');
                const q = query(participationsRef, where('concursoId', '==', concursoId), where('userId', '==', currentUser.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    participationDocRef = querySnapshot.docs[0].ref;
                    currentData = querySnapshot.docs[0].data().imagenes || {};
                } else {
                    participationDocRef = doc(collection(FIRESTORE_DB, 'participacionesConcurso'));
                    currentData = {};
                }
            }
            
            const updatedImages = {
                ...currentData,
                [slotKey]: { url: imageUrl, uploadedAt: serverTimestamp() }
            };

            await setDoc(participationDocRef, {
                concursoId: concursoId,
                userId: currentUser.uid,
                imagenes: updatedImages
            }, { merge: true });

            setUserParticipation(prev => ({
                ...(prev || { concursoId: concursoId, userId: currentUser.uid, id: participationDocRef.id }),
                imagenes: updatedImages
            }));

            Alert.alert("Éxito", `Imagen para ${slotKey} subida correctamente.`);

        } catch (uploadError) {
            console.error(`Error al subir imagen para ${slotKey}:`, uploadError);
            Alert.alert("Error", `No se pudo subir la imagen para ${slotKey}.`);
            setIsUploadingSlot(prev => ({ ...prev, [slotKey]: false }));
        }
    };

    const handleEditConcurso = () => {
        navigation.navigate('CrearConcurso', { concursoId: concursoId });
    };

    const handleVerGaleria = () => {
        navigation.navigate('Galeria', { concursoId: concursoId });
    };

    const handleVerRanking = () => {
        navigation.navigate('RankingConcurso', { concursoId: concursoId });
    };

    if (!concurso && !error) {
        return (
            <View style={styles.containerLoading}>
                <Text>Cargando concurso...</Text>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (error && !concurso) {
        return (
            <View style={styles.containerLoading}>
                <Text style={styles.error}>{error}</Text>
            </View>
        );
    }

    const imageSlots = ['slot1', 'slot2', 'slot3'];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{concurso.nombreEvento}</Text>
            {concurso.imagenConcursoUrl ? (
                <Image source={{ uri: concurso.imagenConcursoUrl }} style={styles.image} />
            ) : null}
            <Text>Tema: {concurso.tema}</Text>
            <Text>Descripción: {concurso.descripcion}</Text>
            <Text>Fecha de inicio: {concurso.fechaInicio}</Text>
            <Text>Fecha de fin: {concurso.fechaFin}</Text>
            <Text>Límite de fotos por persona: {concurso.limiteFotosPorPersona}</Text>
            <Text>Estado: {concurso.estado}</Text>

            {isUserSubscribed && (
            <Pressable 
                style={[styles.button, styles.buttonGaleria]} 
                onPress={handleVerGaleria}
            >
                <Text style={styles.textButton}>Ver Galería</Text>
            </Pressable>
            )}

            {isUserSubscribed && (
            <Pressable 
                style={[styles.button, styles.buttonRanking]} 
                onPress={handleVerRanking}
            >
                <Text style={styles.textButton}>Ver Ranking</Text>
            </Pressable>
            )}

            {isAdminUser && (
                <Pressable 
                    style={[styles.button, styles.buttonEditar]} 
                    onPress={handleEditConcurso}
                >
                    <Text style={styles.textButton}>Editar Concurso</Text>
                </Pressable>
            )}

            <Pressable 
                style={[styles.button, isUserSubscribed ? styles.buttonBaja : styles.buttonInscribir]}
                onPress={handleToggleSubscription}
                disabled={isUpdatingSubscription}
            >
                <Text style={styles.textButton}>
                    {isUpdatingSubscription ? 'Actualizando...' : (isUserSubscribed ? 'Darse de baja' : 'Inscribirse')}
                </Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {isUserSubscribed && (
                <View style={styles.imageUploadSection}>
                    <Text style={styles.sectionTitle}>Sube tus Fotos (hasta 3)</Text>
                    {isFetchingParticipation ? (
                        <ActivityIndicator />
                    ) : (
                        imageSlots.map((slotKey, index) => {
                            const imageData = userParticipation?.imagenes?.[slotKey];
                            return (
                                <View key={slotKey} style={styles.imageSlotContainer}>
                                    <Text style={styles.slotLabel}>Foto {index + 1}:</Text>
                                    {imageData?.url ? (
                                        <Image source={{ uri: imageData.url }} style={styles.uploadedImage} />
                                    ) : (
                                        <Text style={styles.noImageText}>No has subido imagen</Text>
                                    )}
                                    {isUploadingSlot[slotKey] ? (
                                        <ActivityIndicator style={styles.uploadButton} />
                                    ) : (
                                        <Pressable style={styles.uploadButton} onPress={() => handleImageUpload(slotKey)}>
                                            <Text style={styles.uploadButtonText}>{imageData?.url ? 'Cambiar' : 'Subir'}</Text>
                                        </Pressable>
                                    )}
                                </View>
                            );
                        })
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    containerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        marginBottom: 10,
    },
    button: {
        padding: 10,
        textAlign: 'center',
        marginBottom: 12,
        marginHorizontal: 20,
        borderRadius: 5,
        minHeight: 40,
        justifyContent: 'center',
    },
    buttonInscribir: {
        backgroundColor: 'black',
    },
    buttonBaja: {
        backgroundColor: 'red',
    },
    textButton: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    imageUploadSection: {
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: '#ccc',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    imageSlotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 5,
    },
    slotLabel: {
        fontSize: 16,
    },
    uploadedImage: {
        width: 80,
        height: 80,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    noImageText: {
        width: 80,
        height: 80,
        textAlign: 'center',
        textAlignVertical: 'center',
        color: '#888',
        fontSize: 12,
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 5,
        padding: 5,
    },
    uploadButton: {
        backgroundColor: '#007bff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginLeft: 10,
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 14,
    },
    buttonEditar: {
        backgroundColor: 'orange',
        marginTop: 10,
    },
    buttonGaleria: {
        backgroundColor: '#17a2b8',
        marginTop: 10,
    },
    buttonRanking: {
        backgroundColor: '#6f42c1',
        marginTop: 10,
    },
});

export default FichaConcurso;
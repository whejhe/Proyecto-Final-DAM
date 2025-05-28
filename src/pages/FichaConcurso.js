import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, setDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToImgbb, deleteImageFromImgbb } from '../services/imageService';
import { isAdmin, isSuperAdmin } from '../services/authService';
import { getCountdownDetails, calculateTimeRemaining, formatTimeRemaining } from '../services/countdownService';
import { parseDate, formatDate } from '../services/dateService';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const FichaConcurso = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { concursoId, timestamp } = route.params;
    const [concurso, setConcurso] = useState(null);
    const [error, setError] = useState('');
    const [isUserSubscribed, setIsUserSubscribed] = useState(false);
    const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);
    const [countdownLabel, setCountdownLabel] = useState('Cargando...');
    const [countdownTimeValue, setCountdownTimeValue] = useState('');

    const [userParticipation, setUserParticipation] = useState(null);
    const [isFetchingParticipation, setIsFetchingParticipation] = useState(false);
    const [isUploadingSlot, setIsUploadingSlot] = useState({ slot1: false, slot2: false, slot3: false });
    const [isDeletingSlot, setIsDeletingSlot] = useState({ slot1: false, slot2: false, slot3: false });

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
                const superAdmin = await isSuperAdmin(currentUser.uid);
                setIsSuperAdminUser(superAdmin);
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

    useEffect(() => {
        if (!concurso) {
            setCountdownLabel('Cargando datos del concurso...');
            setCountdownTimeValue('');
            console.log('[Cronómetro] Concurso no cargado aún.');
            return;
        }
        console.log('[Cronómetro] Datos del concurso:', JSON.stringify(concurso, null, 2));

        const details = getCountdownDetails(concurso);
        console.log('[Cronómetro] Detalles del countdownService:', details);
        setCountdownLabel(details.label);

        if (!details.isActive || !details.targetDate) {
            setCountdownTimeValue(details.message || '');
            console.log('[Cronómetro] No activo o sin fecha objetivo. Label:', details.label, 'Time/Message:', details.message || '');
            return () => {};
        }

        const parsedTargetDate = details.targetDate instanceof Date ? details.targetDate : parseDate(details.targetDate);
        console.log('[Cronómetro] Fecha objetivo parseada para intervalo:', parsedTargetDate);

        if (!parsedTargetDate || isNaN(parsedTargetDate.getTime())) {
            console.error('[Cronómetro] Fecha objetivo no válida después de parsear para intervalo.');
            setCountdownLabel('Error de Fecha');
            setCountdownTimeValue('No se pudo calcular.');
            return () => {};
        }

        const intervalId = setInterval(() => {
            const remaining = calculateTimeRemaining(parsedTargetDate);
            if (remaining && remaining.totalMilliseconds > 0) {
                setCountdownTimeValue(formatTimeRemaining(remaining));
            } else {
                const currentDetailsAfterExpiry = getCountdownDetails(concurso);
                setCountdownLabel(currentDetailsAfterExpiry.label);
                setCountdownTimeValue(currentDetailsAfterExpiry.message || '');
                console.log('[Cronómetro] Intervalo terminado o tiempo restante 0.');
                clearInterval(intervalId);
            }
        }, 1000);

        return () => {
            console.log('[Cronómetro] Limpiando intervalo.');
            clearInterval(intervalId);
        }

    }, [concurso]);

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
            const imageUploadResult = await uploadImageToImgbb(base64Img);
            setIsUploadingSlot(prev => ({ ...prev, [slotKey]: false }));

            if (!imageUploadResult || !imageUploadResult.display_url) {
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
                [slotKey]: { 
                    url: imageUploadResult.display_url, 
                    delete_url: imageUploadResult.delete_url,
                    uploadedAt: serverTimestamp(),
                    estadoImagen: 'pendiente'
                }
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

            Alert.alert("Éxito", `Imagen para ${slotKey} subida correctamente. Quedará pendiente de validación.`);

        } catch (uploadError) {
            console.error(`Error al subir imagen para ${slotKey}:`, uploadError);
            Alert.alert("Error", `No se pudo subir la imagen para ${slotKey}.`);
            setIsUploadingSlot(prev => ({ ...prev, [slotKey]: false }));
        }
    };

    const handleDeleteImage = async (slotKey, deleteUrl) => {
        console.log(`[handleDeleteImage] Iniciando para slot: ${slotKey}, deleteUrl: ${deleteUrl}`);
        console.log('[handleDeleteImage] currentUser:', currentUser ? currentUser.uid : 'null');
        console.log('[handleDeleteImage] userParticipation:', JSON.stringify(userParticipation));
        console.log('[handleDeleteImage] concurso.estado:', concurso?.estado);
        console.log('[handleDeleteImage] isAdminUser:', isAdminUser);

        if (!currentUser || !userParticipation || !userParticipation.id) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo identificar la participación.' });
            console.warn('[handleDeleteImage] Retornando: Falta currentUser, userParticipation o userParticipation.id');
            return;
        }

        const canDeleteByOwner = currentUser.uid === userParticipation.userId && concurso?.estado === 'activo';
        const canDelete = canDeleteByOwner || isAdminUser;
        console.log(`[handleDeleteImage] canDeleteByOwner: ${canDeleteByOwner}, isAdminUser: ${isAdminUser}, canDelete: ${canDelete}`);

        if (!canDelete) {
            Toast.show({ type: 'error', text1: 'No permitido', text2: 'No puedes eliminar esta imagen en este momento.' });
            console.warn('[handleDeleteImage] Retornando: No tiene permisos para eliminar (canDelete es false).');
            return;
        }

        const performDeletion = async () => {
            console.log(`[handleDeleteImage] Usuario confirmó eliminación para slot: ${slotKey}`);
            setIsDeletingSlot(prev => ({ ...prev, [slotKey]: true }));
            try {
                const participationDocRef = doc(FIRESTORE_DB, 'participacionesConcurso', userParticipation.id);
                const updateData = {};
                updateData[`imagenes.${slotKey}`] = deleteField();
                await updateDoc(participationDocRef, updateData);
                console.log(`[handleDeleteImage] Slot ${slotKey} eliminado de Firestore.`);
                if (deleteUrl) {
                    console.log(`[handleDeleteImage] Llamando a deleteImageFromImgbb con URL: ${deleteUrl}`);
                    await deleteImageFromImgbb(deleteUrl);
                }
                setUserParticipation(prev => {
                    const newImagenes = { ...prev.imagenes };
                    delete newImagenes[slotKey];
                    console.log('[handleDeleteImage] Estado local userParticipation actualizado.', newImagenes);
                    return { ...prev, imagenes: newImagenes };
                });
                Toast.show({ type: 'success', text1: 'Imagen Eliminada', text2: `La imagen del ${slotKey.replace('slot', 'Slot ')} ha sido eliminada.` });
            } catch (e) {
                console.error(`[handleDeleteImage] Error al eliminar imagen del ${slotKey}:`, e);
                Toast.show({ type: 'error', text1: 'Error', text2: `No se pudo eliminar la imagen del ${slotKey}.` });
            } finally {
                setIsDeletingSlot(prev => ({ ...prev, [slotKey]: false }));
            }
        };

        if (Platform.OS === 'web') {
            console.log('[handleDeleteImage] Usando window.confirm para web.');
            if (window.confirm(`¿Estás seguro de que quieres eliminar la imagen del ${slotKey.replace('slot', 'Slot ')}?`)) {
                performDeletion();
            }
        } else {
            console.log('[handleDeleteImage] Usando Alert.alert para móvil.');
            Alert.alert(
                'Confirmar Eliminación',
                `¿Estás seguro de que quieres eliminar la imagen del ${slotKey.replace('slot', 'Slot ')}?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: performDeletion }
                ]
            );
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

    const now = new Date();
    const fechaFinConcurso = concurso?.fechaFin ? parseDate(concurso.fechaFin) : null;
    
    const canSubscribe = concurso?.estado === 'pendiente' || 
                         (concurso?.estado === 'activo' && fechaFinConcurso && now < fechaFinConcurso);
    const canUnsubscribe = isUserSubscribed && concurso?.estado !== 'finalizado';
    const canUploadPhotos = concurso?.estado === 'activo' && isUserSubscribed;
    const canViewGallery = isUserSubscribed && (concurso?.estado === 'activo' || concurso?.estado === 'en votacion' || concurso?.estado === 'finalizado');
    const canViewRanking = concurso?.estado === 'en votacion' || concurso?.estado === 'finalizado';
    const canEditConcurso = (isAdminUser && concurso?.estado !== 'finalizado') || isSuperAdminUser;

    const imageSlots = ['slot1', 'slot2', 'slot3'];

    return (
        <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.container}>
            <Text style={styles.mainTitle}>{concurso.nombreEvento}</Text>
            {concurso.imagenConcursoUrl ? (
                <Image source={{ uri: concurso.imagenConcursoUrl }} style={styles.imagePreview} />
            ) : null}
            
            {concurso && (
                <View style={styles.countdownSection}>
                    <Text style={styles.countdownLabel}>{countdownLabel}</Text>
                    {countdownTimeValue ? <Text style={styles.countdownTimeValue}>{countdownTimeValue}</Text> : null}
                </View>
            )}

            <View style={styles.infoSection}>
                <Text style={styles.sectionHeader}>Detalles del Concurso</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tema:</Text>
                    <Text style={styles.infoValue}>{concurso.tema}</Text>
                </View>
                <View style={styles.infoRowFlexStart}>
                    <Text style={styles.infoLabel}>Descripción:</Text>
                    <Text style={styles.infoValueMultiline}>{concurso.descripcion}</Text>
                </View>
                 <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Estado:</Text>
                    <Text style={[styles.infoValue, getStatusStyle(concurso.estado)]}>{concurso.estado}</Text>
                </View>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionHeader}>Fechas y Límites</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Inicio:</Text>
                    <Text style={styles.infoValue}>{concurso.fechaInicio ? formatDate(parseDate(concurso.fechaInicio)) : 'No especificada'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fin:</Text>
                    <Text style={styles.infoValue}>{concurso.fechaFin ? formatDate(parseDate(concurso.fechaFin)) : 'No especificada'}</Text>
                </View>
                {concurso.fechaFinVotacion && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fin Votación:</Text>
                        <Text style={styles.infoValue}>{formatDate(parseDate(concurso.fechaFinVotacion))}</Text>
                    </View>
                )}
            </View>
            
            {canViewGallery && (
            <Pressable 
                style={[styles.actionButton, styles.galleryButton]} 
                onPress={handleVerGaleria}
            >
                <Text style={styles.actionButtonText}>Ver Galería</Text>
            </Pressable>
            )}

            {canViewRanking && (
            <Pressable 
                style={[styles.actionButton, styles.rankingButton]} 
                onPress={handleVerRanking}
            >
                <Text style={styles.actionButtonText}>Ver Ranking</Text>
            </Pressable>
            )}

            {canEditConcurso && (
                <Pressable style={[styles.actionButton, styles.editButton]} onPress={handleEditConcurso}>
                    <Ionicons name="create-outline" size={20} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.actionButtonText}>Editar Concurso</Text>
                </Pressable>
            )}

            <Pressable 
                style={[
                    styles.actionButton, 
                    isUserSubscribed ? styles.unsubscribeButton : styles.subscribeButton,
                    ((isUserSubscribed && !canUnsubscribe) || (!isUserSubscribed && !canSubscribe)) && styles.buttonDisabled
                ]}
                onPress={handleToggleSubscription}
                disabled={isUpdatingSubscription || (isUserSubscribed ? !canUnsubscribe : !canSubscribe)}
            >
                <Text style={styles.actionButtonText}>
                    {isUpdatingSubscription ? 'Actualizando...' : (isUserSubscribed ? 'Darse de baja' : 'Inscribirse')}
                </Text>
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {canUploadPhotos && (
                <View style={styles.imageUploadSection}>
                    <Text style={styles.uploadSectionTitle}>Sube tus Fotos (hasta {imageSlots.length})</Text>
                    {isFetchingParticipation ? (
                        <ActivityIndicator />
                    ) : (
                        imageSlots.map((slotKey, index) => {
                            const imageData = userParticipation?.imagenes?.[slotKey];
                            const isLoading = isUploadingSlot[slotKey] || isDeletingSlot[slotKey];
                            const canModifyImage = concurso?.estado === 'activo' || isAdminUser;

                            return (
                                <View key={slotKey} style={styles.imageSlotContainer}>
                                    <Text style={styles.slotLabel}>Foto {index + 1}:</Text>
                                    {imageData?.url ? (
                                        <View style={styles.imagePreviewContainerInSlot}>
                                            <Image source={{ uri: imageData.url }} style={styles.uploadedImagePreview} />
                                            {imageData.estadoImagen && 
                                                <Text style={[styles.imageStatus, styles[`status_${imageData.estadoImagen}`]]}>
                                                    {(imageData.estadoImagen.charAt(0).toUpperCase() + imageData.estadoImagen.slice(1)).replace('_', ' ')}
                                                </Text>
                                            }
                                        </View>
                                    ) : (
                                        <View style={styles.noImagePlaceholder}>
                                            <Ionicons name="image-outline" size={30} color="#ccc" />
                                            <Text style={styles.noImageText}>Vacío</Text>
                                        </View>
                                    )}
                                    <View style={styles.slotActionsContainer}>
                                        {isLoading ? (
                                            <ActivityIndicator />
                                        ) : (
                                            <>
                                                {canModifyImage && (
                                                    <Pressable 
                                                        style={[styles.slotActionButton, styles.uploadButton]}
                                                        onPress={() => handleImageUpload(slotKey)}
                                                    >
                                                        <Ionicons name={imageData?.url ? "camera-reverse-outline" : "cloud-upload-outline"} size={20} color="white" />
                                                        <Text style={styles.slotActionButtonText}>{imageData?.url ? 'Cambiar' : 'Subir'}</Text>
                                                    </Pressable>
                                                )}
                                                {imageData?.url && canModifyImage && (
                                                    <Pressable 
                                                        style={[styles.slotActionButton, styles.deleteButtonSlot]}
                                                        onPress={() => handleDeleteImage(slotKey, imageData.delete_url)}
                                                    >
                                                        <Ionicons name="trash-outline" size={20} color="white" />
                                                        <Text style={styles.slotActionButtonText}>Eliminar</Text>
                                                    </Pressable>
                                                )}
                                            </>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'pendiente': return { color: 'orange', fontWeight: 'bold' };
        case 'activo': return { color: 'green', fontWeight: 'bold' };
        case 'en votacion': return { color: 'blue', fontWeight: 'bold' };
        case 'finalizado': return { color: 'grey', fontWeight: 'bold' };
        default: return { color: '#333' };
    }
};

const styles = StyleSheet.create({
    scrollViewContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 15,
        color: '#333',
    },
    imagePreview: {
        width: '100%',
        height: 220,
        resizeMode: 'cover',
        borderRadius: 8,
        marginBottom: 15,
    },
    countdownSection: {
        alignItems: 'center',
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    countdownLabel: { 
        fontSize: 16, 
        color: '#444',
        textAlign: 'center',
        marginBottom: 3, 
    },
    countdownTimeValue: { 
        fontSize: 20, 
        fontWeight: 'bold',
        color: 'tomato', 
        textAlign: 'center',
    },
    infoSection: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007BFF',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderColor: '#ddd',
        paddingBottom: 6,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'center',
    },
    infoRowFlexStart: { 
        flexDirection: 'column', 
        marginBottom: 10,
        alignItems: 'flex-start',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4A4A4A',
        marginRight: 8,
        minWidth: 110, 
    },
    infoValue: {
        fontSize: 15,
        color: '#333',
        flex: 1, 
    },
    infoValueMultiline: { 
        fontSize: 15,
        color: '#333',
        lineHeight: 21, 
        marginTop: 4, 
    },
    actionButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        minHeight: 45, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    galleryButton: { backgroundColor: '#17a2b8' },
    rankingButton: { backgroundColor: '#6f42c1' },
    editButton: { backgroundColor: 'orange' },
    subscribeButton: { backgroundColor: '#28a745' }, 
    unsubscribeButton: { backgroundColor: '#DC3545' }, 
    buttonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    imageUploadSection: {
        marginTop: 20,
        paddingVertical: 15,
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fdfdfd',
        borderRadius: 8,
        paddingHorizontal:10,
    },
    uploadSectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        marginBottom: 18,
        textAlign: 'center',
        color: '#007BFF',
    },
    imageSlotContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    slotLabel: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginRight: 10,
    },
    imagePreviewContainerInSlot: {
        alignItems: 'center',
    },
    uploadedImagePreview: {
        width: 70,
        height: 70,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    noImagePlaceholder: {
        width: 70,
        height: 70,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    noImageText: {
        color: '#aaa',
        fontSize: 11,
        marginTop: 2,
    },
    imageStatus: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 3,
        paddingVertical: 2, 
        paddingHorizontal: 5, 
        borderRadius: 3,
        color: 'white',
        overflow: 'hidden',
        alignSelf: 'center',
        maxWidth: 70,
    },
    status_pendiente: { backgroundColor: 'orange' },
    status_aprobada: { backgroundColor: 'green' },
    status_rechazada: { backgroundColor: 'red' },
    slotActionsContainer: {
        flexDirection: 'column',
        justifyContent: 'space-around',
        marginLeft: 10,
        minHeight: 70,
    },
    slotActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 5,
        minWidth: 100, 
        justifyContent: 'center',
        marginVertical: 3,
    },
    uploadButton: {
        backgroundColor: '#007bff',
    },
    deleteButtonSlot: {
        backgroundColor: '#DC3545',
    },
    slotActionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 5,
    },
    containerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    countdownContainer: {
        alignItems: 'center',
        marginVertical: 10,
    },
    countdownLabelStyle: { 
        fontSize: 17, 
        color: '#333',
        textAlign: 'center',
        marginBottom: 4, 
    },
    countdownTimeValueStyle: { 
        fontSize: 22, 
        fontWeight: 'bold',
        color: 'tomato', 
        textAlign: 'center',
    },
});

export default FichaConcurso;
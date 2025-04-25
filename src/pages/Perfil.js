// src/screens/Perfil.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Text, StyleSheet } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export default function Perfil({ user }) {

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [error, setError] = useState('');

    // Recuperar el avatar desde Firestore
    useEffect(() => {
        const fetchUserAvatar = async () => {
            try {
                const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setAvatarUrl(userData.avatar || null);
                } else {
                    console.error('No se encontró el usuario');
                }
            } catch (err) {
                console.error('Error al recuperar el avatar:', err);
            }
        };

        fetchUserAvatar();
    }, [user]);

    const handleUpdateAvatar = async () => {
        try {
            if (Platform.OS === 'web') {
                // Manejo para la web
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async () => {
                            const base64Avatar = reader.result; // Imagen en Base64
                            setAvatarUrl(base64Avatar);

                            // Guardar la nueva imagen en Firestore
                            await updateDoc(doc(FIRESTORE_DB, 'users', user.uid), { avatar: base64Avatar });

                            console.log('Avatar actualizado correctamente');
                        };
                        reader.readAsDataURL(file); // Leer el archivo como Base64
                    }
                };
                input.click();
            } else {
                // Manejo para dispositivos móviles (iOS/Android)
                const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [4, 3],
                    quality: 1,
                });

                if (!result.canceled) {
                    const base64 = await FileSystem.readAsStringAsync(result.uri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });
                    const base64Avatar = `data:image/jpeg;base64,${base64}`;

                    setAvatarUrl(base64Avatar);

                    // Guardar la nueva imagen en Firestore
                    await updateDoc(doc(FIRESTORE_DB, 'users', user.uid), { avatar: base64Avatar });

                    console.log('Avatar actualizado correctamente');
                } else {
                    console.log('Selección de imagen cancelada');
                }
            }
        } catch (err) {
            setError('Error al actualizar el avatar');
            console.error(err);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Perfil de Usuario</Text>
            {avatarUrl ? (
                <Image
                    source={{ uri: avatarUrl.startsWith('data:image') ? avatarUrl : `data:image/jpeg;base64,${avatarUrl}` }}
                    style={styles.avatar}
                />
            ) : (
                <Text>No hay avatar seleccionado</Text>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Actualizar Avatar" onPress={handleUpdateAvatar} />
            {/* Aquí puedes mostrar otros datos del perfil */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        justifyContent: 'center'
    },
    title: {
        fontSize: 24,
        marginBottom: 20
    },
    error: {
        color: 'red',
        marginVertical: 10
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginVertical: 20
    }
});

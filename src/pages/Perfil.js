// src/screens/Perfil.js
import React, { useState, useEffect } from 'react';
import { View, Button, Image, Text, StyleSheet } from 'react-native';
import { pickImageAndUpload } from '../config/cloudinaryUpload';

export default function Perfil({ user }) {
    // Suponiendo que 'user' es el objeto de usuario que tiene un campo "avatar"
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar || null);
    const [error, setError] = useState('');

    const handleUpdateAvatar = async () => {
        try {
            const url = await pickImageAndUpload();
            if (url) {
                setAvatarUrl(url);
                // Aquí actualizas el perfil del usuario en tu base de datos con la nueva URL
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
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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

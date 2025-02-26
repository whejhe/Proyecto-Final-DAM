import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../config/firebase';
import { signOut } from 'firebase/auth';

const Perfil = () => {
    const navigation = useNavigation();

    const handleLogout = () => {
        signOut(FIREBASE_AUTH)
            .then(() => {
                navigation.navigate('Login'); // Redirigir a la pantalla de Login
            })
            .catch((error) => {
                console.error('Error al cerrar sesión:', error);
            });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Pagina de Perfil</Text>
            <Button title="Logout" onPress={handleLogout} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
});

export default Perfil;
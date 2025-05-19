import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../config/firebase';
import { signOut } from 'firebase/auth';

const Home = () => {
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
            <Text style={styles.title}>Home</Text>
            <Pressable style={styles.button} onPress={() => navigation.navigate('Perfil')}>
                <Text style={styles.textButton}>Ir a Perfil</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => navigation.navigate('ListadoConcursos')}>
                <Text style={styles.textButton}>Listado de Concursos</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => navigation.navigate('PanelAdmin')}>
                <Text style={styles.textButton}>Administrar Concursos</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={handleLogout}>
                <Text style={styles.textButton}>Logout</Text>
            </Pressable>
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
    button: {
        backgroundColor: 'black',
        padding: 10,
        textAlign: 'center',
        marginBottom: 12,
        marginHorizontal: 20,
        borderRadius: 5,
    },
    textButton: {
        color: 'white',
        fontSize: 18,
    },
});

export default Home;
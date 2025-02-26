import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigation = useNavigation();

    const handlePasswordReset = () => {
        if (email === '') {
            setError('Por favor, introduce tu correo electrónico');
        } else {
            sendPasswordResetEmail(FIREBASE_AUTH, email)
                .then(() => {
                    setMessage('Correo de restablecimiento de contraseña enviado');
                    setError('');
                })
                .catch((error) => {
                    setError(error.message);
                    setMessage('');
                });
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <Pressable onPress={handlePasswordReset}>
                <Text style={styles.Button}>Enviar</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={{ textAlign: 'center', color: 'blue', paddingTop: 20 }}>Volver al Login</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        marginLeft: 20,
        marginRight: 20,
    },
    error: {
        color: 'red',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: 'green',
        marginBottom: 12,
        textAlign: 'center',
    },
    Button: {
        backgroundColor: 'black',
        color: 'white',
        padding: 10,
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 12,
        marginLeft: 20,
        marginRight: 20,
        borderRadius: 5,
    },
});

export default ForgotPassword;
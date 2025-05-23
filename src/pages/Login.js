import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../services/authService'; // Importa la función loginUser

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = async () => {
    const { success, user, error: loginError } = await loginUser(email, password);

    if (success) {
      console.log('Usuario autenticado:', email);
      setError('');
      // No necesitas navegar aquí, App.js detectará el cambio en currentUser
    } else {
      setError(loginError);
      console.error("Login failed", loginError);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/login.png')} style={styles.image} />
      <Text style={styles.title}>Login</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Pressable onPress={handleLogin}>
        <Text style={styles.button}>Login</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={{ textAlign: 'center', color: 'blue' }}>Don't have an account? Register</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={{ textAlign: 'center', color: 'blue' }}>Forgot Password?</Text>
      </Pressable>
    </View>
  );
}

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
  button: {
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
  image: {
    width: 120,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
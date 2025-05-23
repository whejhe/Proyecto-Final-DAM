import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../services/authService'; // Importa la función registerUser

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (email === '' || password === '' || name === '') {
      setError('Por favor, completa todos los campos');
      return;
    }

    const { success, user, error: registerError } = await registerUser(email, password, name);

    if (success) {
      console.log('Usuario registrado:', email);
      setError('');
      navigation.navigate('Login');
    } else {
      setError(registerError);
      console.error("Registration failed", registerError);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/avatars/default-User.png')} style={styles.image} />
      <Text style={styles.title}>Create Account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
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
      <Pressable onPress={handleRegister}>
        <Text style={styles.button}>Register</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Login')}>
        <Text style={{ textAlign: 'center', color: 'blue' }}>Already have an account? Login</Text>
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
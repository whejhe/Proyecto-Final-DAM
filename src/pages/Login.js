import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleLogin = () => {
    if (email === '' || password === '') {
      setError('Por favor, completa todos los campos');
    } else {
      signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          console.log('Sesión iniciada con:', user.email);
          setError('');
          navigation.navigate('Home');
        })
        .catch((error) => {
          setError(error.message);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/login.png')} style={styles.image} />
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
        <Text style={styles.Button}>Login</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={{ textAlign: 'center', color: 'blue', paddingBottom: 20 }}>Forgot password?</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={{ textAlign: 'center', color: 'blue' }}>Create account</Text>
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
  image: {
    width: 120,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
  },
});

export default Login;
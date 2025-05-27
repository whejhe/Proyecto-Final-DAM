import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const navigation = useNavigation();

  const handleSelectImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result.split(',')[1];
            try {
              const url = await uploadImageToImgbb(base64);
              if (url) setAvatar(url);
              else setError('Error al subir la imagen');
            } catch (e) {
              setError('Error al subir la imagen');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se requiere permiso para acceder a la galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'Images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });
      if (!result.canceled) {
        const base64 = result.assets[0].base64;
        try {
          const url = await uploadImageToImgbb(base64);
          if (url) setAvatar(url);
          else setError('Error al subir la imagen');
        } catch (e) {
          setError('Error al subir la imagen');
        }
      }
    }
  };

  const handleRegister = async () => {
    if (email === '' || password === '' || name === '') {
      setError('Por favor, completa todos los campos');
      return;
    }
      console.log('Avatar que se va a guardar:', avatar);
    // Llama a registerUser pasando el avatar
    const { success, user, error: registerError } = await registerUser(email, password, name, avatar);
    if (success) {
      setError('');
      navigation.navigate('Login');
    } else {
      setError(registerError);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleSelectImage}>
        <Image
          source={avatar ? { uri: avatar } : require('../../assets/avatars/default-User.png')}
          style={styles.image}
        />
      </Pressable>
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
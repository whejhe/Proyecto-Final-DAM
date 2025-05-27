import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { registerUser } from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';
import { Formik } from 'formik';
import { registerValidationSchema } from '../services/validationService';
import Toast from 'react-native-toast-message';

export default function Register() {
  const [serverError, setServerError] = useState('');
  const navigation = useNavigation();

  const handleSelectImage = async (setFieldValue) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Marker = ';base64,';
            let base64 = reader.result;
            const base64Idx = base64.indexOf(base64Marker);
            if (base64Idx !== -1) {
              base64 = base64.substring(base64Idx + base64Marker.length);
            } else {
              console.warn('Formato de base64 web inesperado.');
            }
            try {
              Toast.show({ type: 'info', text1: 'Subiendo avatar...' });
              const url = await uploadImageToImgbb(base64);
              if (url) {
                setFieldValue('avatar', url);
                setServerError('');
                Toast.show({ type: 'success', text1: 'Avatar subido' });
              } else {
                setServerError('Error al subir imagen (URL no recibida)');
                Toast.show({type: 'error', text1:'Error Avatar', text2: 'No se pudo obtener URL.'});
                setFieldValue('avatar', '');
              }
            } catch (e) {
              setServerError('Error crítico al subir imagen');
              Toast.show({type: 'error', text1:'Error Avatar', text2: 'Fallo crítico al subir.'});
              setFieldValue('avatar', '');
            }
          };
          reader.onerror = () => {
            setServerError("Error al procesar archivo de imagen.");
            Toast.show({type: 'error', text1:'Error Avatar', text2: 'No se pudo procesar archivo.'});
            setFieldValue('avatar', '');
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        Toast.show({ type: 'info', text1: 'Subiendo avatar...' });
        const url = await uploadImageToImgbb(result.assets[0].base64);
        if (url) {
          setFieldValue('avatar', url);
          setServerError('');
          Toast.show({ type: 'success', text1: 'Avatar subido' });
        } else {
          setServerError('Error al subir imagen (móvil, URL no recibida)');
          Toast.show({type: 'error', text1:'Error Avatar', text2: 'No se pudo obtener URL (móvil).'});
          setFieldValue('avatar', '');
        }
      }
    }
  };

  const handleRegisterSubmit = async (values, { setSubmitting }) => {
    setServerError('');
    const { success, user, error: registerError } = await registerUser(
      values.email,
      values.password,
      values.nombreCompleto,
      values.avatar
    );

    if (success) {
      Toast.show({
        type: 'success',
        text1: 'Registro Exitoso',
        text2: '¡Bienvenido! Por favor, inicia sesión.'
      });
      navigation.navigate('Login');
    } else {
      setServerError(registerError);
      Toast.show({
        type: 'error',
        text1: 'Error de Registro',
        text2: registerError,
      });
    }
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={{
        nombreCompleto: '',
        email: '',
        password: '',
        confirmPassword: '',
        avatar: ''
      }}
      validationSchema={registerValidationSchema}
      onSubmit={handleRegisterSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
        <View style={styles.container}>
          <Pressable onPress={() => handleSelectImage(setFieldValue)} disabled={isSubmitting}>
            <Image
              source={values.avatar ? { uri: values.avatar } : require('../../assets/avatars/default-User.png')}
              style={styles.image}
            />
          </Pressable>
          {touched.avatar && errors.avatar && (<Text style={styles.errorTextCentered}>{errors.avatar}</Text>)}

          <Text style={styles.title}>Crear Cuenta</Text>
          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}

          <TextInput
            style={[styles.input, (touched.nombreCompleto && errors.nombreCompleto) && styles.inputError]}
            placeholder="Nombre Completo"
            value={values.nombreCompleto}
            onChangeText={handleChange('nombreCompleto')}
            onBlur={handleBlur('nombreCompleto')}
          />
          {touched.nombreCompleto && errors.nombreCompleto && (<Text style={styles.errorText}>{errors.nombreCompleto}</Text>)}

          <TextInput
            style={[styles.input, (touched.email && errors.email) && styles.inputError]}
            placeholder="Email"
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {touched.email && errors.email && (<Text style={styles.errorText}>{errors.email}</Text>)}

          <TextInput
            style={[styles.input, (touched.password && errors.password) && styles.inputError]}
            placeholder="Contraseña"
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            secureTextEntry
          />
          {touched.password && errors.password && (<Text style={styles.errorText}>{errors.password}</Text>)}

          <TextInput
            style={[styles.input, (touched.confirmPassword && errors.confirmPassword) && styles.inputError]}
            placeholder="Confirmar Contraseña"
            value={values.confirmPassword}
            onChangeText={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            secureTextEntry
          />
          {touched.confirmPassword && errors.confirmPassword && (<Text style={styles.errorText}>{errors.confirmPassword}</Text>)}

          <Pressable onPress={handleSubmit} style={styles.buttonContainer} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Registrando...' : 'Registrarse'}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Login')} disabled={isSubmitting}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia Sesión</Text>
          </Pressable>
        </View>
      )}
    </Formik>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#007BFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 5,
    paddingHorizontal: 15,
    backgroundColor: '#FFF',
    fontSize: 16,
  },
  inputError: {
    borderColor: 'tomato',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  errorText: {
    color: 'tomato',
    fontSize: 13,
    marginBottom: 10,
    paddingLeft: 5,
  },
  errorTextCentered: {
    color: 'tomato',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    backgroundColor: '#28A745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  linkText: {
    textAlign: 'center',
    color: '#007BFF',
    marginTop: 15,
    fontSize: 15,
  },
});
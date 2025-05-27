import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginUser } from '../services/authService';
import Toast from 'react-native-toast-message';
import { Formik } from 'formik';
import { loginValidationSchema } from '../services/validationService';

export default function Login() {
  const [serverError, setServerError] = useState('');
  const navigation = useNavigation();

  const handleLoginSubmit = async (values, { setSubmitting }) => {
    setServerError('');
    const { success, error: loginError } = await loginUser(values.email, values.password);

    if (success) {
      console.log('Usuario autenticado:', values.email);
    } else {
      setServerError(loginError);
      Toast.show({
        type: 'error',
        text1: 'Error de Inicio de Sesión',
        text2: loginError,
        position: 'bottom',
        visibilityTime: 6000,
      });
    }
    setSubmitting(false);
  };

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={loginValidationSchema}
      onSubmit={handleLoginSubmit}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting }) => (
        <View style={styles.container}>
          <Image source={require('../../assets/login.png')} style={styles.image} />
          <Text style={styles.title}>Login</Text>
          
          {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
          
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
            placeholder="Password"
            value={values.password}
            onChangeText={handleChange('password')}
            onBlur={handleBlur('password')}
            secureTextEntry
          />
          {touched.password && errors.password && (<Text style={styles.errorText}>{errors.password}</Text>)}
          
          <Pressable onPress={handleSubmit} style={styles.buttonContainer} disabled={isSubmitting}>
            <Text style={styles.buttonText}>{isSubmitting ? 'Ingresando...' : 'Login'}</Text>
          </Pressable>
          
          <Pressable onPress={() => navigation.navigate('Register')} disabled={isSubmitting}>
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} disabled={isSubmitting}>
            <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
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
    width: 100,
    height: 120,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
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
  buttonContainer: {
    backgroundColor: '#007BFF',
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
    marginTop: 10,
    fontSize: 15,
  },
});
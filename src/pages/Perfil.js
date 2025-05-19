// src/pages/Perfil.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Perfil = () => {
  const [usuario, setUsuario] = useState(null);
  const [imagenAvatar, setImagenAvatar] = useState(null);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const usuarioActual = FIREBASE_AUTH.currentUser;
      if (usuarioActual) {
        const docRef = doc(FIRESTORE_DB, 'users', usuarioActual.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsuario(docSnap.data());
          if (docSnap.data().avatar) {
            setImagenAvatar(docSnap.data().avatar);
          }
        }
      }
    };
    obtenerUsuario();
  }, []);

  return (
    <View style={styles.container}>
      {imagenAvatar ? (
        <Image source={{ uri: imagenAvatar }} style={styles.avatar} />
      ) : (
        <Image source={require('../../assets/avatars/default-User.png')} style={styles.avatar} />
      )}
      <Text style={styles.nombre}>{usuario?.name}</Text>
      <Text style={styles.correo}>{usuario?.email}</Text>
      <Text style={styles.role}>{usuario?.role}</Text>
      <Text style={styles.createdAt}>{usuario?.createdAt.toDate().toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  nombre: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  correo: {
    fontSize: 18,
    marginBottom: 10,
  },
  role: {
    fontSize: 18,
    marginBottom: 10,
  },
  createdAt: {
    fontSize: 14,
    color: '#666',
  },
});

export default Perfil;
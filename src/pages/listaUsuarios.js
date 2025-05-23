import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { ListItem, Avatar, Button } from 'react-native-elements';
import { FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc, getDoc} from 'firebase/firestore';
import { Platform } from 'react-native';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  const bloquearUsuario = async (userId) => {
  try {
    await setDoc(doc(FIRESTORE_DB, 'blockedUsers', userId), { blocked: true });
    setUsuarios(usuarios.map(u => u.id === userId ? { ...u, blocked: true } : u));
  } catch (error) {
    alert('Error al bloquear usuario');
  }
};

const desbloquearUsuario = async (userId) => {
  try {
    await deleteDoc(doc(FIRESTORE_DB, 'blockedUsers', userId));
    setUsuarios(usuarios.map(u => u.id === userId ? { ...u, blocked: false } : u));
  } catch (error) {
    alert('Error al desbloquear usuario');
  }
};

  const obtenerUsuarios = async () => {
  try {
    const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
    const blockedSnapshot = await getDocs(collection(FIRESTORE_DB, 'blockedUsers'));
    const blockedIds = blockedSnapshot.docs.map(doc => doc.id);
    const usuariosData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      blocked: blockedIds.includes(doc.id),
    }));
    setUsuarios(usuariosData);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
  }
};

  useEffect(() => {
    obtenerUsuarios();
  }, []);


  const renderItem = ({ item }) => (
  <ListItem bottomDivider>
    <Avatar
      rounded
      source={item.avatar ? { uri: item.avatar } : require('../../assets/avatars/default-User.png')}
    />
    <ListItem.Content>
      <ListItem.Title>{item.name}</ListItem.Title>
      <ListItem.Subtitle>{item.email}</ListItem.Subtitle>
    </ListItem.Content>
    {item.blocked ? (
      <Button
        title="Desbloquear"
        onPress={() => desbloquearUsuario(item.id)}
        buttonStyle={{ backgroundColor: 'green' }}
      />
    ) : (
      <Button
        title="Bloquear"
        onPress={() => bloquearUsuario(item.id)}
        buttonStyle={{ backgroundColor: 'orange' }}
      />
    )}
  </ListItem>
);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Usuarios</Text>
      <FlatList
        data={usuarios}
        renderItem={renderItem}
        keyExtractor={item => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ListaUsuarios;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert } from 'react-native';
import { ListItem, Avatar, Button } from 'react-native-elements';
import { FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);

  const obtenerUsuarios = async () => {
    try {
      const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'users'));
      const usuariosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const eliminarUsuario = async (userId) => {
    if (Platform.OS === 'web') {
      // Usar confirm en web
      if (window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
        try {
          await deleteDoc(doc(FIRESTORE_DB, 'users', userId));
          setUsuarios(usuarios.filter(user => user.id !== userId));
        } catch (error) {
          console.error('Error al eliminar usuario:', error);
          window.alert('No se pudo eliminar el usuario.');
        }
      }
    } else {
      // Usar Alert en móvil
      Alert.alert(
        'Eliminar usuario',
        '¿Estás seguro de que deseas eliminar este usuario?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteDoc(doc(FIRESTORE_DB, 'users', userId));
                setUsuarios(usuarios.filter(user => user.id !== userId));
              } catch (error) {
                console.error('Error al eliminar usuario:', error);
                Alert.alert('Error', 'No se pudo eliminar el usuario.');
              }
            }
          }
        ]
      );
    }
  };

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
      <Button
        title="Eliminar"
        onPress={() => eliminarUsuario(item.id)}
        buttonStyle={{ backgroundColor: 'red' }}
      />
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
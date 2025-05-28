import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, Platform } from 'react-native';
import { ListItem, Avatar, Button } from 'react-native-elements';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs, doc, deleteDoc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import Toast from 'react-native-toast-message';

const ListaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(null);
  const loggedInUserId = FIREBASE_AUTH.currentUser?.uid;

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (loggedInUserId) {
        const userRef = doc(FIRESTORE_DB, 'users', loggedInUserId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCurrentUserData({ id: userSnap.id, ...userSnap.data() });
        }
      }
    };
    fetchCurrentUser();
    obtenerUsuarios(); // Se sigue llamando aquí para cargar la lista
  }, [loggedInUserId]); // Dependencia del loggedInUserId para recargar si cambia

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
      console.log("[obtenerUsuarios] Usuarios cargados/actualizados:", usuariosData.length);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudieron cargar los usuarios.'});
    }
  };

  const handleRoleChange = async (userId, roleOperation, successMessage, itemToUpdate) => {
    console.log(`[handleRoleChange] Called for userId: ${userId}, operation: ${typeof roleOperation === 'function' ? 'FieldValue' : roleOperation}, item: ${itemToUpdate.name}`);
    try {
      const userDocRef = doc(FIRESTORE_DB, 'users', userId);
      await updateDoc(userDocRef, { role: roleOperation });
      
      Toast.show({ type: 'success', text1: 'Éxito', text2: successMessage });
      await obtenerUsuarios(); // Volver a cargar todos los usuarios para reflejar los cambios de roles
      console.log(`[handleRoleChange] Rol para ${itemToUpdate.name} actualizado en Firestore y lista recargada.`);

    } catch (error) {
      console.error("[handleRoleChange] Error al cambiar rol:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cambiar el rol del usuario.' });
    }
  };

  const promoverAUsuarioAdmin = (item) => {
    console.log(`[promoverAUsuarioAdmin] Iniciando para usuario: ${item.name} (ID: ${item.id})`);
    const message = `¿Estás seguro de que quieres hacer administrador a ${item.name}?\nEl usuario tendrá roles: user, admin.`;
    const confirmAction = () => {
      console.log(`[promoverAUsuarioAdmin] Confirmado. Llamando a handleRoleChange para ${item.name}`);
      handleRoleChange(item.id, arrayUnion("admin"), `${item.name} ahora es administrador.`, item);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        confirmAction();
      }
    } else {
      Alert.alert("Confirmar Acción", message, [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[promoverAUsuarioAdmin] Cancelado por el usuario.") },
        { text: "Hacer Admin", onPress: confirmAction }
      ]);
    }
  };

  const revocarRolAdmin = (item) => {
    console.log(`[revocarRolAdmin] Iniciando para usuario: ${item.name} (ID: ${item.id})`);
    const message = `¿Estás seguro de que quieres quitar el rol de administrador a ${item.name}?\nEl usuario conservará el rol: user.`;
    const confirmAction = () => {
      console.log(`[revocarRolAdmin] Confirmado. Llamando a handleRoleChange para ${item.name}`);
      handleRoleChange(item.id, arrayRemove("admin"), `Se quitó el rol de administrador a ${item.name}.`, item);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        confirmAction();
      }
    } else {
      Alert.alert("Confirmar Acción", message, [
        { text: "Cancelar", style: "cancel", onPress: () => console.log("[revocarRolAdmin] Cancelado por el usuario.") },
        { text: "Quitar Admin", style: "destructive", onPress: confirmAction }
      ]);
    }
  };

  const bloquearUsuario = async (userId, userName) => {
    console.log(`[bloquearUsuario] Iniciando para usuario: ${userName} (ID: ${userId})`);
    const message = `¿Estás seguro de que quieres bloquear a ${userName}?`;
    
    const performBlock = async () => {
      console.log(`[bloquearUsuario] Confirmado para ${userName}. Intentando bloquear...`);
      try {
        console.log(`[bloquearUsuario] Intentando setDoc en 'blockedUsers/${userId}'`);
        await setDoc(doc(FIRESTORE_DB, 'blockedUsers', userId), { blocked: true, blockedAt: new Date() });
        Toast.show({ type: 'success', text1: 'Usuario Bloqueado', text2: `${userName} ha sido bloqueado.` });
        console.log(`[bloquearUsuario] ${userName} bloqueado en Firestore.`);
        await obtenerUsuarios(); // Recargar usuarios para reflejar el bloqueo
        console.log(`[bloquearUsuario] Lista de usuarios recargada después de bloquear a ${userName}.`);
      } catch (error) {
        console.error("[bloquearUsuario] Error al bloquear usuario:", error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Error al bloquear usuario' });
      }
    };

    if (Platform.OS === 'web') {
      if(window.confirm(message)) {
        performBlock();
      }
    } else {
      Alert.alert("Confirmar Bloqueo", message, [
        { text: "Cancelar", style: "cancel", onPress: () => console.log(`[bloquearUsuario] Cancelado para ${userName}`) },
        { text: "Bloquear", style: "destructive", onPress: performBlock }
      ]);
    }
  };

  const desbloquearUsuario = async (userId, userName) => {
    console.log(`[desbloquearUsuario] Iniciando para usuario: ${userName} (ID: ${userId})`);
    const message = `¿Estás seguro de que quieres desbloquear a ${userName}?`;

    const performUnblock = async () => {
      console.log(`[desbloquearUsuario] Confirmado para ${userName}. Intentando desbloquear...`);
      try {
        console.log(`[desbloquearUsuario] Intentando deleteDoc en 'blockedUsers/${userId}'`);
        await deleteDoc(doc(FIRESTORE_DB, 'blockedUsers', userId));
        Toast.show({ type: 'success', text1: 'Usuario Desbloqueado', text2: `${userName} ha sido desbloqueado.` });
        console.log(`[desbloquearUsuario] ${userName} desbloqueado en Firestore.`);
        await obtenerUsuarios(); // Recargar usuarios para reflejar el desbloqueo
        console.log(`[desbloquearUsuario] Lista de usuarios recargada después de desbloquear a ${userName}.`);
      } catch (error) {
        console.error("[desbloquearUsuario] Error al desbloquear usuario:", error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Error al desbloquear usuario' });
      }
    };

    if (Platform.OS === 'web') {
      if(window.confirm(message)){
        performUnblock();
      }
    } else {
      Alert.alert("Confirmar Desbloqueo", message, [
        { text: "Cancelar", style: "cancel", onPress: () => console.log(`[desbloquearUsuario] Cancelado para ${userName}`) },
        { text: "Desbloquear", onPress: performUnblock }
      ]);
    }
  };

  const renderItem = ({ item }) => {
    const isSuperAdminViewing = currentUserData?.role?.includes('superAdmin');
    const isAdminViewing = currentUserData?.role?.includes('admin');

    const itemIsSuperAdmin = item.role?.includes('superAdmin');
    const itemIsAdmin = item.role?.includes('admin');
    const itemIsSelf = item.id === loggedInUserId;

    let roleText = null;
    if (itemIsSuperAdmin) {
      roleText = <Text style={styles.superAdminText}>Super Administrador</Text>;
    } else if (itemIsAdmin) {
      // Asegurarse de que si es admin y user, muestre "Administrador" y no solo "user" si el array es ['user', 'admin']
      roleText = <Text style={styles.adminText}>Administrador</Text>;
    } else if (item.role?.includes('user')) { // Para mostrar "Usuario" si no es admin/superAdmin
        roleText = <Text style={styles.userRoleText}>Usuario</Text>;
    }

    const canBlockUnblock = 
        !itemIsSuperAdmin && // No se puede bloquear/desbloquear a un superAdmin
        !(itemIsAdmin && !isSuperAdminViewing) && // Un admin no puede bloquear/desbloquear a otro admin (solo superAdmin puede)
        !itemIsSelf; // No puede bloquearse a sí mismo

    const canManageAdminRole = 
        isSuperAdminViewing && // Solo el superAdmin puede gestionar roles de admin
        !itemIsSelf && // El superAdmin no puede cambiar su propio rol de admin (podría hacerlo directamente en BD si es el caso)
        !itemIsSuperAdmin; // No se gestiona el rol superAdmin desde aquí

    return (
      <ListItem bottomDivider containerStyle={styles.listItemContainer}>
        <Avatar
          rounded
          source={item.avatar ? { uri: item.avatar } : require('../../assets/avatars/default-User.png')}
          size="medium"
        />
        <ListItem.Content>
          <ListItem.Title style={styles.userName}>{item.name}</ListItem.Title>
          <ListItem.Subtitle style={styles.userEmail}>{item.email}</ListItem.Subtitle>
          {roleText}
        </ListItem.Content>
        <View style={styles.buttonsContainer}> 
          {canBlockUnblock && (
            <>
              {item.blocked ? (
                <Button
                  title="Desbloquear"
                  onPress={() => desbloquearUsuario(item.id, item.name)}
                  buttonStyle={[styles.button, styles.unblockButton]}
                  titleStyle={styles.buttonTitle}
                />
              ) : (
                <Button
                  title="Bloquear"
                  onPress={() => bloquearUsuario(item.id, item.name)}
                  buttonStyle={[styles.button, styles.blockButton]}
                  titleStyle={styles.buttonTitle}
                />
              )}
            </>
          )}
          {canManageAdminRole && (
            <>
              {itemIsAdmin ? (
                <Button
                  title="Quitar Admin"
                  onPress={() => revocarRolAdmin(item)}
                  buttonStyle={[styles.button, styles.removeAdminButton]}
                  titleStyle={styles.buttonTitle}
                />
              ) : (
                <Button
                  title="Hacer Admin"
                  onPress={() => promoverAUsuarioAdmin(item)}
                  buttonStyle={[styles.button, styles.makeAdminButton]}
                  titleStyle={styles.buttonTitle}
                />
              )}
            </>
          )}
        </View>
      </ListItem>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Usuarios</Text>
      {currentUserData ? (
        <FlatList
            data={usuarios}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContentContainer}
        />
      ) : (
        <Text style={styles.loadingText}>Cargando datos del administrador...</Text>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#343a40',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#6c757d',
  },
  listContentContainer: {
    paddingBottom: 20, // Espacio al final de la lista
  },
  listItemContainer: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2, // Sombra suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#212529',
  },
  userEmail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  adminText: {
    color: '#007bff', 
    fontStyle: 'italic',
    fontSize: 13,
  },
  superAdminText: {
    color: '#28a745', 
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontSize: 13,
  },
  userRoleText: { // Estilo para el rol 'user' normal
    color: '#6c757d', 
    fontStyle: 'italic',
    fontSize: 13,
  },
  buttonsContainer: {
    flexDirection: 'column', // Apila los botones verticalmente
    alignItems: 'flex-end', // Alinea los botones a la derecha del contenido del ListItem
    justifyContent: 'center', // Centra los botones verticalmente si hay espacio
  },
  button: {
    paddingVertical: 6, // Botones más pequeños
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 0, // Sin margen izquierdo ya que están apilados
    marginTop: 5, // Espacio entre botones apilados
    minWidth: 110, // Ancho mínimo para asegurar que el texto quepa
    justifyContent:'center',
    alignItems:'center'
  },
  buttonTitle: {
    fontSize: 13, // Texto de botón más pequeño
    fontWeight: '600'
  },
  blockButton: { backgroundColor: '#ffc107' }, // Naranja/Amarillo para bloquear
  unblockButton: { backgroundColor: '#28a745' }, // Verde para desbloquear
  makeAdminButton: { backgroundColor: '#007bff' }, // Azul para hacer admin
  removeAdminButton: { backgroundColor: '#dc3545' }, // Rojo para quitar admin
});

export default ListaUsuarios;
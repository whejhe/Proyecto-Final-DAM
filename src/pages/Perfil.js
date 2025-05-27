import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView
} from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser, signOut } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import uploadImageToImgbb from "../services/imageService";
import { Ionicons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';

const Perfil = ({ onLogout }) => {
  const [serverError, setServerError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordForDelete, setPasswordForDelete] = useState("");

  useEffect(() => {
    const obtenerUsuario = async () => {
      const usuarioActual = FIREBASE_AUTH.currentUser;
      if (usuarioActual) {
        const docRef = doc(FIRESTORE_DB, "users", usuarioActual.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsuario(docSnap.data());
        } else {
          setServerError("No se encontraron datos del usuario.");
        }
      } else {
        setServerError("Usuario no autenticado.");
      }
    };
    obtenerUsuario();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      Toast.show({ type: 'success', text1: 'Sesión Cerrada', text2: 'Vuelve pronto!'});
      if (onLogout) onLogout();
    } catch (error) {
      setServerError("Error al cerrar sesión");
      Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo cerrar sesión.'});
    }
  };

  const selectImage = async () => {
    const processImage = async (base64) => {
      if (!base64) return;
      try {
        Toast.show({ type: 'info', text1: 'Actualizando avatar...'});
        const url = await uploadImageToImgbb(base64);
        if (url) {
          await updateDoc(doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid), { avatar: url });
          setUsuario(prev => ({ ...prev, avatar: url }));
          Toast.show({ type: 'success', text1: 'Avatar Actualizado'});
        } else {
          setServerError("Error al subir la imagen (URL no recibida).");
          Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo obtener URL de ImgBB.'});
        }
      } catch (error) {
        setServerError("Error crítico al actualizar el avatar.");
        Toast.show({ type: 'error', text1: 'Error Crítico', text2: 'No se pudo actualizar el avatar.'});
      }
    };

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Marker = ';base64,';
            let pureBase64String = reader.result;
            const base64Idx = pureBase64String.indexOf(base64Marker);
            if (base64Idx !== -1) {
                pureBase64String = pureBase64String.substring(base64Idx + base64Marker.length);
            }
            await processImage(pureBase64String);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert("Cambiar Avatar", "Elige una opción:", [
        {
          text: "Tomar Foto", onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) { Alert.alert("Permiso Denegado", "Necesitas dar permiso a la cámara."); return; }
            let result = await ImagePicker.launchCameraAsync({ base64: true, allowsEditing: true, aspect: [1,1], quality: 0.8 });
            if (!result.canceled) await processImage(result.assets[0].base64);
          }
        },
        {
          text: "Elegir de Galería", onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) { Alert.alert("Permiso Denegado", "Necesitas dar permiso a la galería."); return; }
            let result = await ImagePicker.launchImageLibraryAsync({ base64: true, allowsEditing: true, aspect: [1,1], quality: 0.8 });
            if (!result.canceled) await processImage(result.assets[0].base64);
          }
        },
        { text: "Cancelar", style: "cancel" }
      ]);
    }
  };

  const handleDeleteAccount = () => {
    setServerError(null);
    setShowPasswordPrompt(true);
  };

  const confirmDeletionWithPassword = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user || !user.email || !passwordForDelete) {
      setServerError("Contraseña no proporcionada.");
      Toast.show({type: 'error', text1:'Error', text2: 'Por favor, introduce tu contraseña.'});
      return;
    }
    try {
      Toast.show({type:'info', text1: 'Eliminando cuenta...'});
      const credential = EmailAuthProvider.credential(user.email, passwordForDelete);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(FIRESTORE_DB, "users", user.uid));
      await deleteUser(user);
      setShowPasswordPrompt(false);
      setPasswordForDelete("");
      Toast.show({type:'success', text1: 'Cuenta Eliminada', text2: 'Lamentamos verte ir.'});
      if(onLogout) onLogout();
    } catch (error) {
      setShowPasswordPrompt(false);
      setPasswordForDelete("");
      setServerError(`Error al eliminar: ${error.message}`);
      Toast.show({type: 'error', text1:'Error Eliminación', text2: `No se pudo eliminar la cuenta: ${error.message.substring(0,100)}`});
    }
  };

  if (!usuario) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#CCC" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
          {serverError && <Text style={styles.errorText}>{serverError}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable onPress={selectImage} style={styles.avatarContainer}>
          <Image 
            source={usuario.avatar ? { uri: usuario.avatar } : require("../../assets/avatars/default-User.png")} 
            style={styles.avatar} 
          />
          <View style={styles.editAvatarIconContainer}>
            <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
          </View>
        </Pressable>
        
        <Text style={styles.nombre}>{usuario?.name || "Nombre no disponible"}</Text>
        <Text style={styles.correo}>{usuario?.email || "Email no disponible"}</Text>
        <Text style={styles.role}>Rol: {usuario?.role ? usuario.role : 'No especificado'}</Text>
        
        {usuario?.createdAt && (
          <Text style={styles.createdAt}>
            Miembro desde: {new Date(usuario.createdAt.seconds * 1000).toLocaleDateString()}
          </Text>
        )}

        {serverError && <Text style={[styles.errorText, {textAlign: 'center', marginBottom: 15}]}>{serverError}</Text>}

        <Pressable style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </Pressable>
        
        <Pressable style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={22} color="#FFF" style={{marginRight: 10}} />
          <Text style={styles.buttonText}>Eliminar Cuenta</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPasswordPrompt}
        onRequestClose={() => {
          setShowPasswordPrompt(false);
          setPasswordForDelete("");
          setServerError(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirmar Eliminación</Text>
            <Text style={styles.modalMessage}>Por seguridad, introduce tu contraseña para eliminar tu cuenta permanentemente.</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry
              value={passwordForDelete}
              onChangeText={setPasswordForDelete}
              placeholder="Contraseña"
              autoCapitalize="none"
            />
            {serverError && showPasswordPrompt && <Text style={styles.errorTextModal}>{serverError}</Text>}
            <View style={styles.modalButtonContainer}>
                <Pressable style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => { setShowPasswordPrompt(false); setPasswordForDelete(""); setServerError(null);}}>
                    <Text style={styles.modalButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.modalButton, styles.modalButtonConfirm]} onPress={confirmDeletionWithPassword}>
                    <Text style={styles.modalButtonText}>Confirmar</Text>
                </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeAreaLoading: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: '#555',
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#007BFF",
  },
  editAvatarIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20, 
  },
  nombre: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  correo: {
    fontSize: 17,
    color: "#555",
    marginBottom: 8,
  },
  role: {
    fontSize: 15,
    color: "#777",
    fontStyle: 'italic',
    marginBottom: 8,
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
  },
  createdAt: {
    fontSize: 14,
    color: "#777",
    marginBottom: 25,
  },
  button: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: '100%',
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: '#6C757D',
  },
  deleteButton: {
    backgroundColor: "#DC3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  errorText: {
    color: "#DC3545",
    fontSize: 14,
  },
  errorTextModal: {
    color: "#DC3545",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 22,
  },
  passwordInput: {
    height: 50,
    borderColor: "#DDD",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonCancel: {
    backgroundColor: '#6C757D',
  },
  modalButtonConfirm: {
    backgroundColor: '#DC3545',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default Perfil;
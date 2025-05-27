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
} from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { reauthenticateWithCredential, EmailAuthProvider, deleteUser, signOut } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import uploadImageToImgbb from "../services/imageService";

const Perfil = ({ onLogout }) => {
  const [error, setError] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [imagenAvatar, setImagenAvatar] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const obtenerUsuario = async () => {
      const usuarioActual = FIREBASE_AUTH.currentUser;
      if (usuarioActual) {
        const docRef = doc(FIRESTORE_DB, "users", usuarioActual.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsuario(userData);
          if (userData.avatar) {
            setImagenAvatar(userData.avatar);
          }
        }
      }
    };
    obtenerUsuario();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      onLogout();
    } catch (error) {
      setError("Error al cerrar sesión");
    }
  };

  const selectImage = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64 = reader.result.split(",")[1];
            try {
              const url = await uploadImageToImgbb(base64);
              if (url) {
                setImagenAvatar(url);
                await updateDoc(
                  doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                  { avatar: url }
                );
              } else {
                setError("Error al subir la imagen");
              }
            } catch (error) {
              setError("Error en la solicitud");
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Se requieren permisos para acceder a la galería.");
        return;
      }
      Alert.alert(
        "Seleccionar imagen",
        "Elige una opción",
        [
          {
            text: "Tomar foto",
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                alert("Se requieren permisos para acceder a la cámara.");
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
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
                  if (url) {
                    setImagenAvatar(url);
                    await updateDoc(
                      doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                      { avatar: url }
                    );
                  } else {
                    setError("Error al subir la imagen");
                  }
                } catch (error) {
                  setError("Error en la solicitud");
                }
              }
            },
          },
          {
            text: "Elegir de la galería",
            onPress: async () => {
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
                  if (url) {
                    setImagenAvatar(url);
                    await updateDoc(
                      doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                      { avatar: url }
                    );
                  } else {
                    setError("Error al subir la imagen");
                  }
                } catch (error) {
                  setError("Error en la solicitud");
                }
              }
            },
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAccount = () => {
    setError(null);
    setShowPasswordPrompt(true);
  };

  const confirmDeletionWithPassword = async () => {
    const user = FIREBASE_AUTH.currentUser;
    if (!user || !user.email || !password) {
      setError("Usuario no autenticado o contraseña no proporcionada.");
      setShowPasswordPrompt(false);
      setPassword("");
      return;
    }
    try {
      // Reautenticación necesaria para eliminar el usuario en web y móvil
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Elimina el documento de Firestore
      await deleteDoc(doc(FIRESTORE_DB, "users", user.uid));

      // Elimina el usuario de Auth
      await deleteUser(user);

      setShowPasswordPrompt(false);
      setPassword("");
      onLogout();
    } catch (error) {
      setShowPasswordPrompt(false);
      setPassword("");
      setError(`Error al eliminar la cuenta: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={selectImage}>
        {imagenAvatar ? (
          <Image source={{ uri: imagenAvatar }} style={styles.avatar} />
        ) : (
          <Image
            source={require("../../assets/avatars/default-User.png")}
            style={styles.avatar}
          />
        )}
      </Pressable>
      <Text style={styles.nombre}>{usuario?.name}</Text>
      <Text style={styles.correo}>{usuario?.email}</Text>
      <Text style={styles.role}>{usuario?.role}</Text>
      {usuario?.createdAt && (
        <Text style={styles.createdAt}>
          {usuario.createdAt.toDate
            ? usuario.createdAt.toDate().toLocaleString()
            : usuario.createdAt}
        </Text>
      )}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.textButton}>Logout</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.deleteButton]}
        onPress={handleDeleteAccount}
      >
        <Text style={styles.textButton}>Eliminar cuenta</Text>
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPasswordPrompt && (
        <View style={styles.passwordPromptOverlay}>
          <View style={styles.passwordPromptContainer}>
            <Text>Introduce tu contraseña para confirmar:</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              autoCapitalize="none"
              keyboardType="default"
            />
            <Pressable
              style={styles.button}
              onPress={confirmDeletionWithPassword}
            >
              <Text style={styles.textButton}>Confirmar Eliminación</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowPasswordPrompt(false);
                setPassword("");
                setError(null);
              }}
            >
              <Text style={styles.textButton}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  nombre: {
    fontSize: 24,
    fontWeight: "bold",
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
    color: "#666",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 5,
    minWidth: 150,
  },
  textButton: {
    color: "white",
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: "red",
    marginTop: 20,
  },
  passwordPromptOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  passwordPromptContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
    maxWidth: 350,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 10,
    marginBottom: 20,
    width: "100%",
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#666",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default Perfil;
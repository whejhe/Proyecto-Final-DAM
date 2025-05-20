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
import { useNavigation } from "@react-navigation/native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { deleteUser } from "firebase/auth"; // Importa deleteUser
import { signOut } from "firebase/auth";
import * as ImagePicker from "expo-image-picker";
import uploadImageToImgbb from "../services/imageService"; // Importa la función correctamente

const Perfil = ({ onLogout }) => {
  // Recibe onLogout como prop
  const navigation = useNavigation();
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
          console.log("Datos del usuario al entrar al perfil:", userData); // Añade este console.log
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
      onLogout(); // Llama a la función onLogout pasada como prop
    } catch (error) {
      console.error("Error signing out:", error);
      // Opcional: mostrar un mensaje de error al usuario si el logout falla
    }
  };

  const selectImage = async () => {
    if (Platform.OS === "web") {
      // Manejo para la web
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
              const url = await uploadImageToImgbb(base64); // Llama a la función importada
              if (url) {
                setImagenAvatar(url);
                await updateDoc(
                  doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                  {
                    avatar: url,
                  }
                );
              } else {
                setError("Error al subir la imagen");
              }
            } catch (error) {
              console.error("Error en la solicitud:", error);
              setError("Error en la solicitud");
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Manejo para dispositivos móviles (iOS/Android)
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
              const { status } =
                await ImagePicker.requestCameraPermissionsAsync();
              if (status !== "granted") {
                alert("Se requieren permisos para acceder a la cámara.");
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
                    // Actualiza el avatar en Firestore
                    await updateDoc(
                      doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                      {
                        avatar: url,
                      }
                    );
                  } else {
                    setError("Error al subir la imagen");
                  }
                } catch (error) {
                  console.error("Error en la solicitud:", error);
                  setError("Error en la solicitud");
                }
              }
            },
          },
          {
            text: "Elegir de la galería",
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
                    // Actualiza el avatar en Firestore
                    await updateDoc(
                      doc(FIRESTORE_DB, "users", FIREBASE_AUTH.currentUser.uid),
                      {
                        avatar: url,
                      }
                    );
                  } else {
                    setError("Error al subir la imagen");
                  }
                } catch (error) {
                  console.error("Error en la solicitud:", error);
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
    console.log("handleDeleteAccount se ha ejecutado");
    Alert.alert(
      "Eliminar cuenta",
      "¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible. Por favor, confirma tu contraseña.",
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setPassword(""),
        },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            setError(null);
            console.log("showPasswordPrompt antes:", showPasswordPrompt); // Añade este console.log
            setShowPasswordPrompt(true);
            console.log("showPasswordPrompt después:", showPasswordPrompt); // Añade este console.log
          },
        },
      ],
      { cancelable: false }
    );
  };

  const confirmDeletionWithPassword = async () => {
    console.log("confirmDeletionWithPassword se ha ejecutado"); // Añade este console.log
    const user = FIREBASE_AUTH.currentUser;

    // Validación básica: asegurar que hay usuario y contraseña ingresada
    if (!user || !user.email || !password) {
      setError("Usuario no autenticado o contraseña no proporcionada.");
      setShowPasswordPrompt(false);
      setPassword("");
      console.log(
        "Error: Usuario no autenticado o contraseña no proporcionada."
      ); // Añade este console.log
      return;
    }

    try {
      console.log("Intentando reautenticar...");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      console.log("Usuario reautenticado con éxito.");

      // Si la reautenticación fue exitosa, procedemos con la eliminación
      setShowPasswordPrompt(false);
      setPassword("");

      console.log("Borrando datos de Firestore...");
      const userRef = doc(FIRESTORE_DB, "users", user.uid);
      await deleteDoc(userRef);
      console.log("Datos de Firestore borrados.");

      console.log("Borrando usuario de Firebase Auth...");
      await deleteUser(user); // Esto ahora debería funcionar después de la reautenticación
      console.log("Usuario de Firebase Auth borrado.");

      console.log("Cuenta eliminada correctamente");
      onLogout(); // Esto se llama después de una eliminación exitosa (Auth también cierra sesión)
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      // Maneja los errores de reautenticación o eliminación aquí
      // Por ejemplo, error.code === 'auth/wrong-password' para contraseña incorrecta
      setShowPasswordPrompt(false);
      setPassword("");
      setError(`Error: ${error.message}`);
      console.log("Error al eliminar la cuenta:", error.message); // Añade este console.log
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
      {/* Asegúrate de que usuario.createdAt existe antes de llamar a toDate */}
      {usuario?.createdAt && (
        <Text style={styles.createdAt}>
          {usuario.createdAt.toDate().toLocaleString()}
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

      {/* Muestra el mensaje de error si existe */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* --- INICIO DEL JSX DEL MODAL DE CONTRASEÑA (AHORA DENTRO DEL RETURN) --- */}
      {showPasswordPrompt && (
        <View style={styles.passwordPromptOverlay}>
          <View style={styles.passwordPromptContainer}>
            <Text>Introduce tu contraseña para confirmar:</Text>
            <TextInput
              style={styles.passwordInput}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña" // Añadido placeholder
              autoCapitalize="none" // Útil para campos de contraseña
              keyboardType="default" // o 'email-address' dependiendo de la necesidad, pero default es común
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
                setPassword(""); // Limpia la contraseña al cancelar
                setError(null); // Limpia el error al cancelar
              }}
            >
              <Text style={styles.textButton}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      )}
      {/* --- FIN DEL JSX DEL MODAL DE CONTRASEÑA --- */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative", // Asegura que el overlay absoluto se posicione correctamente
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
    marginBottom: 10, // Añadido un pequeño margen
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    // textAlign: "center", // textAlign no es una propiedad de View/Pressable, se usa en Text
    alignItems: "center", // Centra el contenido (texto)
    justifyContent: "center", // Centra el contenido (texto)
    marginTop: 20,
    borderRadius: 5,
    minWidth: 150, // Añade un ancho mínimo para que los botones se vean uniformes
  },
  textButton: {
    color: "white",
    fontSize: 18,
  },
  deleteButton: {
    backgroundColor: "red",
    marginTop: 20,
  },
  // --- NUEVOS ESTILOS PARA EL MODAL Y ERRORES ---
  passwordPromptOverlay: {
    position: "absolute", // Para cubrir toda la pantalla
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fondo semi-transparente más oscuro para mayor contraste
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000, // Asegura que esté por encima de otros elementos
  },
  passwordPromptContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center", // Centra los elementos dentro del modal
    width: "80%", // O un ancho fijo
    maxWidth: 350, // Ancho máximo un poco más grande
    elevation: 10, // Añade sombra en Android
    shadowColor: "#000", // Añade sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginTop: 10,
    marginBottom: 20, // Espacio antes de los botones
    width: "100%", // Ocupa todo el ancho del contenedor
    borderRadius: 5,
  },
  cancelButton: {
    backgroundColor: "#666", // Un color gris para el botón cancelar
    marginTop: 10, // Espacio entre los botones
  },
  errorText: {
    // Estilo para mostrar mensajes de error
    color: "red",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20, // Añade padding para que no toque los bordes
  },
  // --- FIN DE NUEVOS ESTILOS ---
});

export default Perfil;
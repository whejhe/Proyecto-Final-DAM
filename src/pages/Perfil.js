// src/pages/Perfil.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import uploadImageToImgbb from "../services/imageService"; // Importa la función correctamente

const Perfil = () => {
  const [usuario, setUsuario] = useState(null);
  const [imagenAvatar, setImagenAvatar] = useState(null);

  useEffect(() => {
    const obtenerUsuario = async () => {
      const usuarioActual = FIREBASE_AUTH.currentUser;
      if (usuarioActual) {
        const docRef = doc(FIRESTORE_DB, "users", usuarioActual.uid);
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
      <Text style={styles.createdAt}>
        {usuario?.createdAt.toDate().toLocaleString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
});

export default Perfil;

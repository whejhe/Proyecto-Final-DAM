import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FIREBASE_AUTH, FIRESTORE_DB } from "../config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import { Platform } from "react-native";


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [error, setError] = useState("");
  const navigation = useNavigation();

  const defaultAvatar = require("../../assets/img/avatars/default-User.png");

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    createUserWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log("Usuario registrado:", user.email);

        await setDoc(doc(FIRESTORE_DB, "users", user.uid), {
          name: name,
          email: email,
          avatar: avatar || null, // Guardar la imagen en Base64
          role: "participant",
          createdAt: serverTimestamp(),
        });

        setError("");
        navigation.navigate("Login");
        console.log("Registro exitoso. Avatar almacenado en Base64.");
      })
      .catch((error) => {
        setError(error.message);
      });
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
        reader.onload = () => {
          setAvatar(reader.result); // Guardar la imagen como Base64
          console.log("Imagen seleccionada en la web:", reader.result);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  } else {
    // Manejo para dispositivos móviles (iOS/Android)
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
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 1,
            });

            if (!result.canceled) {
              const base64 = await FileSystem.readAsStringAsync(result.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              setAvatar(`data:image/jpeg;base64,${base64}`);
              console.log("Imagen seleccionada desde la cámara:", base64);
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
            });

            if (!result.canceled) {
              const base64 = await FileSystem.readAsStringAsync(result.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
              setAvatar(`data:image/jpeg;base64,${base64}`);
              console.log("Imagen seleccionada desde la galería:", base64);
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
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo Electronico"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <Pressable
          onPress={() => setShowPassword(!showPassword)}
          style={styles.icon}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="gray"
          />
        </Pressable>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <Pressable
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.icon}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={20}
            color="gray"
          />
        </Pressable>
      </View>
      <Pressable onPress={selectImage}>
        <Image
          source={
            avatar
              ? { uri: avatar }
              : defaultAvatar
          }
          style={styles.image}
        />
      </Pressable>
      <Pressable style={styles.button} onPress={handleRegister}>
        <Text style={styles.textButton}>Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    marginHorizontal: 20,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    position: "relative",
  },
  passwordInput: {
    flex: 1,
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  icon: {
    padding: 10,
    position: "absolute",
    right: 0,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  image: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    textAlign: "center",
    marginBottom: 12,
    marginHorizontal: 20,
    borderRadius: 5,
  },
  textButton: {
    color: "white",
    fontSize: 18,
    textAlign: "center",
  },
  showPasswordButton: {
    color: "blue",
    textAlign: "right",
    marginRight: 20,
    marginBottom: 12,
  },
});

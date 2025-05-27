import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 ¡Bienvenido a TuMejorToma!</Text>
      <Text style={styles.description}>
        Tu espacio para participar, votar y celebrar la mejor fotografía.
        {'\n'}
        Explora concursos activos, sube tus mejores capturas y deja que el mundo
        las admire.
        {'\n'}
        ¡Inspírate, compite y gana!
      </Text>
      <Pressable
        style={styles.button}
        onPress={() => navigation.navigate("ListadoConcursos")}
      >
        <Text style={styles.buttonText}>Ver Concursos</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
});

export default Home;
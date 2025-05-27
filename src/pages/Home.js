import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const Home = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={80} color="#007BFF" style={styles.icon} />
        <Text style={styles.title}>¡Bienvenido a TuMejorToma!</Text>
        <Text style={styles.description}>
          Tu espacio para participar, votar y celebrar la mejor fotografía.
          Explora concursos activos, sube tus mejores capturas y ¡deja que el mundo las admire!
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => navigation.navigate("ListadoConcursos")}
        >
          <Text style={styles.buttonText}>Explorar Concursos</Text>
          <Ionicons name="arrow-forward-circle-outline" size={24} color="white" style={{ marginLeft: 8 }}/>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  description: {
    fontSize: 17,
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default Home;
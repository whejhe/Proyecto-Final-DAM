import React, { useState, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import PanelAdmin from "./pages/PanelAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import Perfil from "./pages/Perfil";
// import { getAuth, onAuthStateChanged } from "firebase/auth"; // Elimina signOut
import { FIREBASE_AUTH, onAuthStateChanged } from './config/firebase';
import ListadoConcursos from "./pages/ListadoConcursos";
import FichaConcurso from "./pages/FichaConcurso";
import { Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CrearConcurso from "./pages/CrearConcurso";
import ListaUsuarios from "./pages/listaUsuarios";
import Galeria from './pages/Galeria';
import RankingConcurso from './pages/RankingConcurso';
import { logoutUser, isAdmin } from "./services/authService"; // Importa logoutUser
import Toast from 'react-native-toast-message';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function HomeStack({ currentUser }) {
  return (
    <Stack.Navigator
      screenOptions={{ // Opciones por defecto para HomeStack
        headerStyle: {
          backgroundColor: '#2C2C2C', // Gris oscuro
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="Home" options={{headerShown:false}} component={Home} />
      <Stack.Screen name="ListadoConcursos" component={ListadoConcursos} />
      <Stack.Screen name="FichaConcurso" component={FichaConcurso} />
      <Stack.Screen name="Galeria" component={Galeria} />
      <Stack.Screen name="RankingConcurso" component={RankingConcurso} />
      <Stack.Screen name="CrearConcurso">
        {(props) => <CrearConcurso {...props} currentUser={currentUser} />}
      </Stack.Screen>
      <Stack.Screen name="ListaUsuarios" component={ListaUsuarios} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const handleLogout = async () => {
    // Mueve la función handleLogout a App.js
    const { success, error } = await logoutUser();
    if (success) {
      setCurrentUser(null); // Establece currentUser a null para mostrar el Stack Navigator de autenticación
    } else {
      console.error("Error al cerrar sesión:", error);
    }
  };

  useEffect(() => {
    const auth = FIREBASE_AUTH;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const admin = await isAdmin(user.uid);
        setIsAdminUser(admin);
      } else {
        setIsAdminUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <NavigationContainer>
      {currentUser ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            // Opciones de cabecera para las pantallas del TabNavigator
            headerStyle: {
              backgroundColor: '#2C2C2C', // Gris oscuro
            },
            headerTintColor: '#fff', // Texto blanco
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === "HomeTab") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Perfil") {
                iconName = focused ? "person" : "person-outline";
              } else if (route.name === "PanelAdmin") { // Icono para PanelAdmin
                iconName = focused ? "cog" : "cog-outline";
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: "#FFFFFF", // Color activo del icono/texto: Blanco
            tabBarInactiveTintColor: "#B0B0B0", // Color inactivo del icono/texto: Gris claro
            tabBarStyle: [
              {
                backgroundColor: '#2C2C2C', // Gris oscuro para la barra de pestañas
              },
              null
            ]
          })}
        >
          <Tab.Screen name="HomeTab" options={{ headerShown: false }}>
            {(props) => (
              <HomeStack
                {...props}
                currentUser={currentUser}
                // options={{ headerShown: false }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Perfil">
            {(props) =>
              currentUser ? (
                <Perfil {...props} user={currentUser} onLogout={handleLogout} />
              ) : (
                <Text>Cargando...</Text>
              )
            }
          </Tab.Screen>
          {isAdminUser && (
            <Tab.Screen name="PanelAdmin" component={PanelAdmin} />
          )}
        </Tab.Navigator>
      ) : (
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#2C2C2C', // Gris oscuro
            },
            headerTintColor: '#fff', // Texto blanco
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Register" component={Register} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        </Stack.Navigator>
      )}
      <Toast />
    </NavigationContainer>
  );
}

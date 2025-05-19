import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from "@react-navigation/native";
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import PanelAdmin from './pages/PanelAdmin';
import ForgotPassword from './pages/ForgotPassword';
import Perfil from './pages/Perfil';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import ListadoConcursos from './pages/ListadoConcursos';
import FichaConcurso from './pages/FichaConcurso';
import { FIRESTORE_DB } from './config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Text } from 'react-native';

const Stack = createStackNavigator();

export default function App() {

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(FIRESTORE_DB, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setIsAdmin(userData?.role?.includes('admin'));
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="ListadoConcursos" component={ListadoConcursos} />
        <Stack.Screen name="FichaConcurso" component={FichaConcurso} />
         {isAdmin ? (
          <Stack.Screen name="PanelAdmin" component={PanelAdmin} />
        ) : null}
        <Stack.Screen name="Perfil">
          {(props) =>
            currentUser ? (
              <Perfil {...props} user={currentUser} />
            ) : (
              <Text>Cargando...</Text>
            )
          }
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
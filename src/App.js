import React from 'react';
import * as native from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Login from './pages/Login';
import Register from './pages/Register';

const Stack = createStackNavigator();

export default function App() {
  console.log('Starting App');
  return (
    <native.NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
      </Stack.Navigator>
    </native.NavigationContainer>
  );
}

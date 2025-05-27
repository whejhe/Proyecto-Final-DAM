import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, indexedDBLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyBeXLiIyUWw5l-pn1P83mHiMJwBmQAR10g',
  authDomain: 'proyecto-final-dam-67fa8.firebaseapp.com',
  projectId: 'proyecto-final-dam-67fa8',
  storageBucket: 'proyecto-final-dam-67fa8.firebasestorage.app',
  messagingSenderId: '356684956021',
  appId: '1:356684956021:web:0ff57c92e0eefb144c533c',
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);

// Detectar si la aplicación se está ejecutando en un dispositivo móvil o en un entorno web
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Initialize Firebase Auth with persistence
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
  persistence: isMobile
    ? getReactNativePersistence(ReactNativeAsyncStorage)
    : indexedDBLocalPersistence,
});

export const FIRESTORE_DB = getFirestore(FIREBASE_APP);

// Exportar la función onAuthStateChanged
export { onAuthStateChanged };
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIRESTORE_DB = getFirestore(FIREBASE_APP);
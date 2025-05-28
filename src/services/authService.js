import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

// Función para registrar un usuario
export const registerUser = async (email, password, name, avatar) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
    const user = userCredential.user;
    await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      role: ['user'],
      createdAt: new Date(),
      avatar: avatar || null,
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para iniciar sesión
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
    const user = userCredential.user;
    // Comprobar si está bloqueado
    const blockedDoc = await getDoc(doc(FIRESTORE_DB, 'blockedUsers', user.uid));
    if (blockedDoc.exists()) {
      await signOut(FIREBASE_AUTH);
      // Mensaje de error más específico
      return { success: false, error: 'Tu cuenta ha sido bloqueada por un administrador debido al incumplimiento de las normas. Por favor, contacta con soporte para más información.' };
    }
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(FIREBASE_AUTH);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para verificar si el usuario es administrador o super administrador
export const isAdmin = async (userId) => {
  try {
    if (!userId) return false; // Añadida verificación por si userId es null o undefined
    const userRef = doc(FIRESTORE_DB, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Verifica si el array de roles incluye 'admin' o 'superAdmin'
      return userData?.role?.includes('admin') || userData?.role?.includes('superAdmin');
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user data for admin check:", error);
    return false;
  }
};

// Función para verificar si el usuario es super administrador
export const isSuperAdmin = async (userId) => {
  try {
    if (!userId) return false;
    const userRef = doc(FIRESTORE_DB, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      // Verifica si el array de roles incluye 'superAdmin'
      return userData?.role?.includes('superAdmin');
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user data for superAdmin check:", error);
    return false;
  }
};
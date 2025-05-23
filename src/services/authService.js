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
      role: [],
      createdAt: new Date(),
      avatar: avatar || null,
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Función para iniciar sesión
// export const loginUser = async (email, password) => {
//   try {
//     const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
//     const user = userCredential.user;
//     return { success: true, user };
//   } catch (error) {
//     return { success: false, error: error.message };
//   }
// };
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
    const user = userCredential.user;
    // Comprobar si está bloqueado
    const blockedDoc = await getDoc(doc(FIRESTORE_DB, 'blockedUsers', user.uid));
    if (blockedDoc.exists()) {
      await signOut(FIREBASE_AUTH);
      return { success: false, error: 'Usuario bloqueado. Contacta con el administrador.' };
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

// Función para verificar si el usuario es administrador
export const isAdmin = async (userId) => {
  try {
    const userRef = doc(FIRESTORE_DB, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData?.role?.includes('admin');
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return false;
  }
};
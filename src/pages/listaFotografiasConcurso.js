// src/pages/listaFotografiasConcurso.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

async function votar(user, photoId) {
  try {
    await addDoc(collection(FIRESTORE_DB, 'votos'), {
      userId: user.uid,
      photoId,
      createdAt: serverTimestamp(),
    });
    // Opcional: Actualizar contador en el documento de la fotografía.
  } catch (error) {
    console.error('Error al votar:', error);
  }
}

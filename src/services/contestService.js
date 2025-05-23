import { FIRESTORE_DB } from '../config/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';

// Función para crear un concurso
export const createContest = async (contestData) => {
    try {
        const docRef = await addDoc(collection(FIRESTORE_DB, 'concursos'), {
            ...contestData,
            createdAt: serverTimestamp()
        });
        console.log('Concurso creado con ID: ', docRef.id);

        await updateDoc(doc(FIRESTORE_DB, 'concursos', docRef.id), {
            estado: contestData.estado,
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error al crear el concurso: ', error);
        return { success: false, error: error.message };
    }
};

// Función para obtener todos los concursos
export const getContests = async () => {
    try {
        const querySnapshot = await getDocs(collection(FIRESTORE_DB, 'concursos'));
        const contests = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return { success: true, contests };
    } catch (error) {
        console.error('Error al obtener los concursos: ', error);
        return { success: false, error: error.message };
    }
};

// Función para obtener un concurso por su ID
export const getContest = async (contestId) => {
    try {
        const docRef = doc(FIRESTORE_DB, 'concursos', contestId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, contest: docSnap.data() };
        } else {
            return { success: false, error: 'Concurso no encontrado' };
        }
    } catch (error) {
        console.error('Error al obtener el concurso: ', error);
        return { success: false, error: error.message };
    }
};

// Función para actualizar un concurso
export const updateContest = async (contestId, contestData) => {
    try {
        const docRef = doc(FIRESTORE_DB, 'concursos', contestId);
        await updateDoc(docRef, contestData);
        console.log('Concurso actualizado con ID: ', contestId);
        return { success: true };
    } catch (error) {
        console.error('Error al actualizar el concurso: ', error);
        return { success: false, error: error.message };
    }
};

// Función para eliminar un concurso
export const deleteContest = async (contestId) => {
    try {
        const docRef = doc(FIRESTORE_DB, 'concursos', contestId);
        await deleteDoc(docRef);
        console.log('Concurso eliminado con ID: ', contestId);
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar el concurso: ', error);
        return { success: false, error: error.message };
    }
};
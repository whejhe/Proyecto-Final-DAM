import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_DB } from '../config/firebase';

export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(FIRESTORE_DB, 'users', userId));
        if (userDoc.exists()) {
          setUser(userDoc.data());
        } else {
          setError('Usuario no encontrado');
        }
      } catch (err) {
        setError('Error al cargar el usuario');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    } else {
      setError('ID de usuario no proporcionado');
      setLoading(false);
    }
  }, [userId]);

  return { user, loading, error };
};
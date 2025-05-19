import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FIRESTORE_DB } from '../config/firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FIREBASE_AUTH } from '../config/firebase';

const FichaConcurso = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { concursoId } = route.params;
    const [concurso, setConcurso] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const obtenerConcurso = async () => {
            try {
                const docRef = doc(FIRESTORE_DB, 'concursos', concursoId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setConcurso(docSnap.data());
                } else {
                    setError("No se encontró el concurso");
                }
            } catch (e) {
                console.error("Error al obtener el concurso: ", e);
                setError("Error al obtener el concurso");
            }
        };

        obtenerConcurso();
    }, [concursoId]);

    const handleInscribirse = async () => {
        try {
            const userId = FIREBASE_AUTH.currentUser.uid;
            const concursoRef = doc(FIRESTORE_DB, 'concursos', concursoId);

            await updateDoc(concursoRef, {
                usersId: arrayUnion(userId)
            });

            if (Platform.OS === 'web') {
                alert('Te has inscrito en el concurso correctamente');
            } else {
                Alert.alert('Éxito', 'Te has inscrito en el concurso correctamente');
            }
            console.log('Usuario inscrito en el concurso:', userId);
        } catch (e) {
            console.error("Error al inscribirse en el concurso: ", e);
            setError("Error al inscribirse en el concurso");
        }
    };

    if (!concurso) {
        return (
            <View style={styles.container}>
                <Text>Cargando...</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{concurso.nombreEvento}</Text>
            {concurso.imagenConcursoUrl ? (
                <Image source={{ uri: concurso.imagenConcursoUrl }} style={styles.image} />
            ) : null}
            <Text>Tema: {concurso.tema}</Text>
            <Text>Descripción: {concurso.descripcion}</Text>
            <Text>Fecha de inicio: {concurso.fechaInicio}</Text>
            <Text>Fecha de fin: {concurso.fechaFin}</Text>
            <Text>Límite de fotos por persona: {concurso.limiteFotosPorPersona}</Text>
            <Text>Estado: {concurso.estado}</Text>

            <Pressable style={styles.button} onPress={handleInscribirse}>
                <Text style={styles.textButton}>Inscribirse</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 10,
        textAlign: 'center',
    },
    image: {
        width: '100%',
        height: 200, // Ajusta la altura según tus necesidades
        resizeMode: 'cover', // o 'contain' según cómo quieras que se ajuste la imagen
        marginBottom: 10,
    },
    button: {
        backgroundColor: 'black',
        padding: 10,
        textAlign: 'center',
        marginBottom: 12,
        marginHorizontal: 20,
        borderRadius: 5,
    },
    textButton: {
        color: 'white',
        fontSize: 18,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
});

export default FichaConcurso;
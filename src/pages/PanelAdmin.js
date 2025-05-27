import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import CrearConcurso from './CrearConcurso'; // Importa el componente CrearConcurso
import ListaUsuarios from './listaUsuarios';
import { parseDate } from '../services/dateService'; // Importa parseDate desde dateService

const PanelAdmin = () => {
    const navigation = useNavigation();
    const [estado] = useState('pendiente'); // Solo se necesita estado si se usa en el render, sino se puede eliminar también.

    useEffect(() => {
        // Función para actualizar el estado del concurso
        const updateContestStatus = async () => {
            const now = new Date();
            const concursosRef = collection(FIRESTORE_DB, 'concursos');
            const concursosSnap = await getDocs(concursosRef);

            concursosSnap.forEach(async doc => {
                const concurso = doc.data();
                const inicio = parseDate(concurso.fechaInicio);
                const fin = parseDate(concurso.fechaFin);

                if (!inicio || !fin) return;

                let nuevoEstado = 'pendiente';
                if (inicio > now) {
                    nuevoEstado = 'pendiente';
                } else if (inicio <= now && fin >= now) {
                    nuevoEstado = 'activo';
                } else if (fin < now) {
                    nuevoEstado = 'finalizado';
                }

                // Actualiza el estado solo si ha cambiado
                if (nuevoEstado !== concurso.estado) {
                    try {
                        // Actualiza el estado del concurso en Firestore
                        await updateDoc(doc.ref, {
                            estado: nuevoEstado,
                        });
                        console.log('Estado del concurso actualizado en Firestore a:', nuevoEstado);
                    } catch (error) {
                        console.error('Error al actualizar el estado del concurso en Firestore:', error);
                    }
                }
            });
        };

        // Llama a la función al montar el componente y cada minuto
        updateContestStatus();
        const intervalId = setInterval(updateContestStatus, 60000); // Cada minuto

        // Limpia el intervalo al desmontar el componente
        return () => clearInterval(intervalId);
    }, []);

    const goToCrearConcurso = () => {
        navigation.navigate('HomeTab', { screen: 'CrearConcurso' });
    };

    const goToListaUsuarios = () => {
        navigation.navigate('HomeTab', { screen: 'ListaUsuarios' });
    };

    const goToListadoConcursos = () => {
        navigation.navigate('HomeTab', { screen: 'ListadoConcursos' });
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Panel de Administrador</Text>

            <Pressable style={styles.button} onPress={goToCrearConcurso}>
                <Text style={styles.textButton}>Crear Concurso</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={goToListaUsuarios}>
                <Text style={styles.textButton}>Lista de Usuarios</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={goToListadoConcursos}>
                <Text style={styles.textButton}>Ver Concursos</Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
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
});

export default PanelAdmin;
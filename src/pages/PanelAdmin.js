import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs, updateDoc } from 'firebase/firestore';
import CrearConcurso from './CrearConcurso'; // Importa el componente CrearConcurso
import ListaUsuarios from './listaUsuarios';
import { parseDate } from '../services/dateService'; // Importa parseDate desde dateService

const PanelAdmin = () => {
    const navigation = useNavigation();
    // const [estado] = useState('pendiente'); // Comentado ya que no se usa en el render directamente

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
                const finVotacion = concurso.fechaFinVotacion ? parseDate(concurso.fechaFinVotacion) : null; // Parsear fechaFinVotacion

                if (!inicio || !fin) return; // Si las fechas base no existen, no podemos determinar el estado

                let nuevoEstado = concurso.estado; // Por defecto, mantener el estado actual

                if (inicio > now) {
                    nuevoEstado = 'pendiente';
                } else if (inicio <= now && fin >= now) {
                    nuevoEstado = 'activo';
                } else if (fin < now && finVotacion && finVotacion >= now) { // Comprobar que finVotacion exista
                    nuevoEstado = 'en votacion';
                } else if ((finVotacion && finVotacion < now) || (!finVotacion && fin < now)) { 
                    // Si finVotacion existe y ya pasó, o si no existe finVotacion y ya pasó fin
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
        <ImageBackground 
            source={require('../../assets/backgrounds/background-admin.png')} 
            style={styles.backgroundImageContainer}
            resizeMode="cover" // Para asegurar que cubra bien
        >
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
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImageContainer: {
        flex: 1, 
        width: '100%', // Asegurar ancho completo en web
        height: '100%', // Asegurar alto completo en web
    },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.3)', // Un overlay oscuro semitransparente para legibilidad
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF', // Cambiado a blanco para mejor contraste con overlay y fondo
        marginBottom: 30,
        textAlign: 'center',
        // Añadir sombra al texto para destacarlo más del fondo
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: {width: -1, height: 1},
        textShadowRadius: 10
    },
    button: {
        backgroundColor: 'tomato',
        paddingVertical: 15,
        paddingHorizontal: 10,
        textAlign: 'center',
        marginBottom: 15,
        borderRadius: 8,
        width: '80%',
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    },
    textButton: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default PanelAdmin;
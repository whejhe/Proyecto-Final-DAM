import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { isAdmin } from '../services/authService';
import { deleteContest } from '../services/contestService'; // Importa la función deleteContest

const ListadoConcursos = () => {
    const [concursos, setConcursos] = useState([]);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const obtenerConcursos = async () => {
            const concursosRef = collection(FIRESTORE_DB, 'concursos');
            const concursosSnap = await getDocs(concursosRef);
            const concursosList = concursosSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConcursos(concursosList);
        };

        const checkAdminStatus = async () => {
            const user = FIREBASE_AUTH.currentUser;
            if (user) {
                const admin = await isAdmin(user.uid);
                setIsAdminUser(admin);
            } else {
                setIsAdminUser(false);
            }
        };

        obtenerConcursos();
        checkAdminStatus();
    }, []);

    const handleConcursoPress = (concursoId) => {
        navigation.navigate('FichaConcurso', { concursoId: concursoId });
    };

    const handleDeleteConcurso = async (concursoId) => {
        console.log("Eliminar concurso con ID: ", concursoId);
        Alert.alert(
            "Eliminar Concurso",
            "¿Estás seguro de que quieres eliminar este concurso?",
            [
                {
                    text: "Cancelar",
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    onPress: async () => {
                        try {
                            const { success, error } = await deleteContest(concursoId); // Llama a la función deleteContest de contestService

                            if (success) {
                                // Actualizar la lista de concursos después de eliminar
                                const concursosRef = collection(FIRESTORE_DB, 'concursos');
                                const concursosSnap = await getDocs(concursosRef);
                                const concursosList = concursosSnap.docs.map(doc => ({
                                    id: doc.id,
                                    ...doc.data()
                                }));
                                setConcursos(concursosList);
                                Alert.alert("Concurso eliminado correctamente");
                            } else {
                                console.error("Error al eliminar el concurso: ", error);
                                Alert.alert("Error al eliminar el concurso");
                            }
                        } catch (error) {
                            console.error("Error al eliminar el concurso: ", error);
                            Alert.alert("Error al eliminar el concurso");
                        }
                    },
                    style: "destructive"
                }
            ]
        );
        console.log("Concurso eliminado con ID: ", concursoId);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Listado Concursos</Text>
            <FlatList
                data={concursos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.concursoItemContainer}>
                        <Pressable
                            style={styles.concursoItem}
                            onPress={() => handleConcursoPress(item.id)}
                        >
                            <Text style={styles.concursoTitle}>{item.nombreEvento}</Text>
                            <Text style={styles.concursoEstado}>Estado: {item.estado}</Text>
                        </Pressable>
                        {isAdminUser && (
                            <Pressable
                                style={styles.deleteButton}
                                onPress={() => handleDeleteConcurso(item.id)}
                            >
                                <Text style={styles.deleteButtonText}>Eliminar</Text>
                            </Pressable>
                        )}
                    </View>
                )}
            />
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
        marginBottom: 20,
        textAlign: 'center',
    },
    concursoItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    concursoItem: {
        flex: 1,
    },
    concursoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    concursoEstado: {
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: 'red',
        padding: 8,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default ListadoConcursos;
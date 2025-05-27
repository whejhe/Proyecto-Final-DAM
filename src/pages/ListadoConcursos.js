import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Alert, Platform } from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { isAdmin } from '../services/authService';
import { deleteContest } from '../services/contestService';

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
        const performDelete = async () => {
            try {
                console.log(`Intentando eliminar concurso: ${concursoId}`);
                const { success, error } = await deleteContest(concursoId);

                if (success) {
                    console.log(`Concurso ${concursoId} eliminado con éxito de Firestore.`);
                    setConcursos(prevConcursos => prevConcursos.filter(c => c.id !== concursoId));
                    
                    const successMessage = "Concurso eliminado correctamente junto con sus participaciones.";
                    if (Platform.OS === 'web') {
                        window.alert(successMessage);
                    } else {
                        Alert.alert("Éxito", successMessage);
                    }
                } else {
                    console.error(`Error al eliminar el concurso ${concursoId} desde deleteContest: `, error);
                    const errorMessage = `Error al eliminar el concurso: ${error || 'Error desconocido'}`;
                    if (Platform.OS === 'web') {
                        window.alert(errorMessage);
                    } else {
                        Alert.alert("Error", errorMessage);
                    }
                }
            } catch (e) {
                console.error(`Excepción al intentar eliminar el concurso ${concursoId}: `, e);
                const errorMessage = `Excepción al eliminar el concurso: ${e.message || 'Error desconocido'}`;
                if (Platform.OS === 'web') {
                    window.alert(errorMessage);
                } else {
                    Alert.alert("Error", errorMessage);
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("¿Estás seguro de que quieres eliminar este concurso? Esto eliminará también todas las inscripciones y fotos asociadas.")) {
                await performDelete();
            }
        } else {
            Alert.alert(
                "Confirmar Eliminación",
                "¿Estás seguro de que quieres eliminar este concurso? Esto eliminará también todas las inscripciones y fotos asociadas.",
                [
                    {
                        text: "Cancelar",
                        style: "cancel"
                    },
                    {
                        text: "Eliminar",
                        onPress: async () => await performDelete(),
                        style: "destructive"
                    }
                ],
                { cancelable: true }
            );
        }
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
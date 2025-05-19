import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FIRESTORE_DB } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const ListadoConcursos = () => {
    const [concursos, setConcursos] = useState([]);

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

        obtenerConcursos();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Listado Concursos</Text>
            <FlatList
                data={concursos}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.concursoItem}>
                        <Text style={styles.concursoTitle}>{item.nombreEvento}</Text>
                        <Text style={styles.concursoEstado}>Estado: {item.estado}</Text>
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
    concursoItem: {
        marginBottom: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    concursoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    concursoEstado: {
        fontSize: 16,
    },
});

export default ListadoConcursos;
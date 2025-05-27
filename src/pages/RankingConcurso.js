import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FIRESTORE_DB } from '../config/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Función auxiliar para obtener el nombre del usuario (similar a la de Galeria.js)
const fetchNombreUsuario = async (userId) => {
    if (!userId) return 'Usuario Desconocido';
    try {
        const userDocRef = doc(FIRESTORE_DB, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            return userDocSnap.data().name || 'Usuario Anónimo'; // Asumiendo que el campo es 'name'
        } else {
            return 'Usuario Desconocido';
        }
    } catch (e) {
        console.error("Error obteniendo nombre de usuario para ranking: ", e);
        return 'Error Usuario';
    }
};

const RankingConcurso = () => {
    const route = useRoute();
    const { concursoId } = route.params;

    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRankingData = useCallback(async () => {
        if (!concursoId) {
            setError('ID de concurso no proporcionado.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const participationsRef = collection(FIRESTORE_DB, 'participacionesConcurso');
            const qParticipation = query(participationsRef, where('concursoId', '==', concursoId));
            const participationSnapshot = await getDocs(qParticipation);

            if (participationSnapshot.empty) {
                setLoading(false);
                // No hay participaciones, rankingData ya es [] así que mostrará el mensaje correcto
                return;
            }

            const todasLasImagenesConPuntuacion = [];

            for (const participationDoc of participationSnapshot.docs) {
                const participationData = participationDoc.data();
                const nombreUsuario = await fetchNombreUsuario(participationData.userId);

                if (participationData.imagenes) {
                    for (const slotKey of Object.keys(participationData.imagenes)) {
                        const imagenInfo = participationData.imagenes[slotKey];
                        if (imagenInfo && imagenInfo.url) {
                            let sumaVotos = 0;
                            let numeroVotos = 0;
                            if (imagenInfo.votos) {
                                Object.values(imagenInfo.votos).forEach(voto => {
                                    sumaVotos += voto;
                                    numeroVotos++;
                                });
                            }
                            const puntuacionMedia = numeroVotos > 0 ? sumaVotos / numeroVotos : 0;

                            todasLasImagenesConPuntuacion.push({
                                idImagen: `${participationDoc.id}-${slotKey}`,
                                urlImagen: imagenInfo.url,
                                nombreUsuario: nombreUsuario,
                                userIdDueño: participationData.userId,
                                puntuacionMedia: puntuacionMedia,
                                numeroVotos: numeroVotos // Podría ser útil para mostrar
                            });
                        }
                    }
                }
            }

            // Ordenar por puntuación media (descendente) y luego por número de votos (descendente como desempate)
            todasLasImagenesConPuntuacion.sort((a, b) => {
                if (b.puntuacionMedia !== a.puntuacionMedia) {
                    return b.puntuacionMedia - a.puntuacionMedia;
                }
                return b.numeroVotos - a.numeroVotos; // Más votos primero en caso de empate de media
            });

            setRankingData(todasLasImagenesConPuntuacion.slice(0, 10)); // Tomar las 10 primeras

        } catch (e) {
            console.error("Error obteniendo datos del ranking: ", e);
            setError("No se pudo cargar el ranking.");
        } finally {
            setLoading(false);
        }
    }, [concursoId]);

    useEffect(() => {
        fetchRankingData();
    }, [fetchRankingData]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="tomato" />
                <Text>Cargando ranking...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (rankingData.length === 0) {
        return (
            <View style={styles.centered}>
                <Text>Aún no hay datos suficientes para mostrar en el ranking.</Text>
            </View>
        );
    }

    const renderItem = ({ item, index }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.rankPosition}>{index + 1}º</Text>
            <Image source={{ uri: item.urlImagen }} style={styles.image} />
            <View style={styles.infoContainer}>
                <Text style={styles.userName}>{item.nombreUsuario}</Text>
                <Text style={styles.score}>Puntuación: {item.puntuacionMedia.toFixed(1)} ({item.numeroVotos} votos)</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Top 10 Fotos del Concurso</Text>
            <FlatList
                data={rankingData}
                renderItem={renderItem}
                keyExtractor={(item) => item.idImagen}
                ListEmptyComponent={
                    <View style={styles.centered}><Text>No hay participaciones aún.</Text></View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f0f0f0',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    rankPosition: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
        color: 'tomato',
        minWidth: 30,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#444',
    },
    score: {
        fontSize: 15,
        color: '#666',
    },
});

export default RankingConcurso;

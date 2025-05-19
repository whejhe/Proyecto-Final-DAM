import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../config/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';

const PanelAdmin = () => {
    const navigation = useNavigation();

    const [nombreEvento, setNombreEvento] = useState('');
    const [tema, setTema] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [limiteFotosPorPersona, setLimiteFotosPorPersona] = useState('3');
    const [imagenConcursoUrl, setImagenConcursoUrl] = useState('');
    const [estado, setEstado] = useState('pendiente'); // Estado inicial: pendiente
    const [error, setError] = useState('');
    const [fechaInicioError, setFechaInicioError] = useState('');
    const [fechaFinError, setFechaFinError] = useState('');

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
    }, [fechaInicio, fechaFin, estado]);

    const handleCrearConcurso = async () => {
        try {
            if (!nombreEvento || !tema || !fechaInicio || !fechaFin || !descripcion || !limiteFotosPorPersona || !imagenConcursoUrl) {
                setError('Todos los campos son obligatorios');
                return;
            }

            const inicio = parseDate(fechaInicio);
            const fin = parseDate(fechaFin);

            if (!inicio) {
                setFechaInicioError('Formato de fecha incorrecto (YYYY-MM-DD)');
                return;
            }
            if (!fin) {
                setFechaFinError('Formato de fecha incorrecto (YYYY-MM-DD)');
                return;
            }

            const concursoData = {
                usersId: [],
                nombreEvento: nombreEvento,
                tema: tema,
                fechaInicio: inicio.toISOString(), // Almacena como string ISO
                fechaFin: fin.toISOString(), // Almacena como string ISO
                descripcion: descripcion,
                limiteFotosPorPersona: parseInt(limiteFotosPorPersona),
                imagenConcursoUrl: imagenConcursoUrl,
                estado: estado,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(FIRESTORE_DB, 'concursos'), concursoData);
            console.log('Concurso creado con ID: ', docRef.id);

            // Actualiza el estado del concurso en Firestore
            await updateDoc(doc(FIRESTORE_DB, 'concursos', docRef.id), {
                estado: estado,
            });

            setNombreEvento('');
            setTema('');
            setFechaInicio('');
            setFechaFin('');
            setDescripcion('');
            setLimiteFotosPorPersona('3');
            setImagenConcursoUrl('');
            setEstado('pendiente');
            setError('');
            setFechaInicioError('');
            setFechaFinError('');

            Alert.alert('Éxito', 'Concurso creado correctamente');
            navigation.goBack(); // Navega hacia atrás
        } catch (e) {
            console.error('Error al crear el concurso: ', e);
            setError('Error al crear el concurso');
        }
    };

    const selectImage = async () => {
        if (Platform.OS === 'web') {
            // Lógica para la web
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';

            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        const base64 = reader.result;
                        try {
                            const url = await uploadImageToImgbb(base64);
                            if (url) {
                                setImagenConcursoUrl(url);
                            } else {
                                setError("Error al subir la imagen");
                            }
                        } catch (uploadError) {
                            console.error("Error en la solicitud:", uploadError);
                            setError("Error en la solicitud");
                        }
                    };
                    reader.onerror = (error) => {
                        console.error("Error al leer el archivo:", error);
                        setError("Error al leer el archivo");
                    };
                    reader.readAsDataURL(file);
                }
            };

            input.click();
        } else {
            // Lógica para dispositivos móviles
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true,
            });

            if (!result.canceled) {
                const base64 = result.assets[0].base64;
                try {
                    const url = await uploadImageToImgbb(base64);
                    if (url) {
                        setImagenConcursoUrl(url);
                    } else {
                        setError("Error al subir la imagen");
                    }
                } catch (error) {
                    console.error("Error en la solicitud:", error);
                    setError("Error en la solicitud");
                }
            }
        }
    };

    const parseDate = (dateString) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return null;
        }
        try {
            return new Date(dateString);
        } catch (error) {
            console.warn("Error parsing date string:", dateString);
            return null;
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Panel de Administrador - Crear Concurso</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Nombre del Evento"
                value={nombreEvento}
                onChangeText={setNombreEvento}
            />
            <TextInput
                style={styles.input}
                placeholder="Tema"
                value={tema}
                onChangeText={setTema}
            />

            <TextInput
                style={styles.input}
                placeholder="Fecha de Inicio (YYYY-MM-DD)"
                value={fechaInicio}
                onChangeText={(text) => {
                    setFechaInicio(text);
                    setFechaInicioError('');
                }}
            />
            {fechaInicioError ? <Text style={styles.error}>{fechaInicioError}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Fecha de Fin (YYYY-MM-DD)"
                value={fechaFin}
                onChangeText={(text) => {
                    setFechaFin(text);
                    setFechaFinError('');
                }}
            />
            {fechaFinError ? <Text style={styles.error}>{fechaFinError}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
            />
            <TextInput
                style={styles.input}
                placeholder="Límite de Fotos por Persona"
                value={limiteFotosPorPersona}
                onChangeText={setLimiteFotosPorPersona}
                keyboardType="number-pad"
            />

            <Pressable style={styles.imagePicker} onPress={selectImage}>
                <Text style={styles.imagePickerText}>Seleccionar Imagen del Concurso</Text>
            </Pressable>

            <Text>Imagen seleccionada: {imagenConcursoUrl}</Text>

            <Pressable style={styles.button} onPress={handleCrearConcurso}>
                <Text style={styles.textButton}>Crear Concurso</Text>
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
    input: {
        width: '100%',
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        borderRadius: 5,
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
    imagePicker: {
        backgroundColor: 'lightgray',
        padding: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
    imagePickerText: {
        fontSize: 16,
    },
    datePickerButton: {
        backgroundColor: 'lightblue',
        padding: 10,
        borderRadius: 5,
        marginBottom: 12,
    },
});

export default PanelAdmin;
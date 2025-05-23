import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { FIRESTORE_DB, FIREBASE_AUTH } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';
import { isAdmin } from '../services/authService';
import { createContest } from '../services/contestService';
import { formatDate } from '../services/dateService';

import DateTimePicker from '@react-native-community/datetimepicker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const CrearConcurso = ({ currentUser }) => {
    const navigation = useNavigation();

    const [nombreEvento, setNombreEvento] = useState('');
    const [tema, setTema] = useState('');
    const [fechaInicio, setFechaInicio] = useState(new Date());
    const [fechaFin, setFechaFin] = useState(new Date());
    const [descripcion, setDescripcion] = useState('');
    const [limiteFotosPorPersona, setLimiteFotosPorPersona] = useState('3');
    const [imagenConcursoUrl, setImagenConcursoUrl] = useState('');
    const [estado, setEstado] = useState('pendiente');
    const [error, setError] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
    const [showDatePickerFin, setShowDatePickerFin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (currentUser) {
                const admin = await isAdmin(currentUser.uid);
                setIsAdminUser(admin);
            } else {
                setIsAdminUser(false);
            }
        };

        checkAdminStatus();
    }, [currentUser]);

    const handleCrearConcurso = async () => {
        try {
            console.log('isAdminUser:', isAdminUser);
            if (!isAdminUser) {
                setError('No tienes permisos para crear concursos.');
                return;
            }

            if (!nombreEvento || !tema || !fechaInicio || !fechaFin || !descripcion || !limiteFotosPorPersona || !imagenConcursoUrl) {
                setError('Todos los campos son obligatorios');
                return;
            }

            const contestData = {
                usersId: [],
                nombreEvento: nombreEvento,
                tema: tema,
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                descripcion: descripcion,
                limiteFotosPorPersona: parseInt(limiteFotosPorPersona),
                imagenConcursoUrl: imagenConcursoUrl,
                estado: estado,
                creatorId: currentUser.uid,
            };

            const { success, id, error: contestError } = await createContest(contestData);

            if (success) {
                console.log('Concurso creado con ID: ', id);

                setNombreEvento('');
                setTema('');
                setFechaInicio(new Date());
                setFechaFin(new Date());
                setDescripcion('');
                setLimiteFotosPorPersona('3');
                setImagenConcursoUrl('');
                setEstado('pendiente');
                setError('');

                Alert.alert('Éxito', 'Concurso creado correctamente');
                navigation.goBack();
            } else {
                setError(contestError);
                console.error('Error al crear el concurso: ', contestError);
            }
        } catch (e) {
            console.error('Error al crear el concurso: ', e);
            setError('Error al crear el concurso');
        }
    };

    const selectImage = async () => {
        if (Platform.OS === 'web') {
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
                        setError("Error al subir la imagen");
                    };
                    reader.readAsDataURL(file);
                }
            };

            input.click();
        } else {
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
                    setError("Error al subir la imagen");
                }
            }
        }
    };

    const onChangeFechaInicio = (event, selectedDate) => {
        const currentDate = selectedDate || fechaInicio;
        setShowDatePickerInicio(Platform.OS === 'ios');
        setFechaInicio(currentDate);
    };

    const onChangeFechaFin = (event, selectedDate) => {
        const currentDate = selectedDate || fechaFin;
        setShowDatePickerFin(Platform.OS === 'ios');
        setFechaFin(currentDate);
    };

    const showModeInicio = () => {
        setShowDatePickerInicio(true);
    };

    const showModeFin = () => {
        setShowDatePickerFin(true);
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Crear Concurso</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!isAdminUser && <Text style={styles.error}>No tienes permisos para crear concursos.</Text>}

            <TextInput
                style={styles.input}
                placeholder="Nombre del Evento"
                value={nombreEvento}
                onChangeText={setNombreEvento}
                editable={isAdminUser}
            />
            <TextInput
                style={styles.input}
                placeholder="Tema"
                value={tema}
                onChangeText={setTema}
                editable={isAdminUser}
            />

            {Platform.OS === 'web' ? (
                <>
                    <Text>Fecha de Inicio:</Text>
                    <DatePicker
                        selected={fechaInicio}
                        onChange={(date) => setFechaInicio(date)}
                        dateFormat="yyyy-MM-dd"
                        disabled={!isAdminUser}
                    />

                    <Text>Fecha de Fin:</Text>
                    <DatePicker
                        selected={fechaFin}
                        onChange={(date) => setFechaFin(date)}
                        dateFormat="yyyy-MM-dd"
                        disabled={!isAdminUser}
                    />
                </>
            ) : (
                <>
                    <View>
                        <Text>Fecha de Inicio:</Text>
                        <Pressable onPress={showModeInicio} disabled={!isAdminUser}>
                            <TextInput
                                style={styles.input}
                                placeholder="Fecha de Inicio"
                                value={formatDate(fechaInicio)}
                                editable={false}
                            />
                        </Pressable>
                        {showDatePickerInicio && (
                            <DateTimePicker
                                testID="dateTimePickerInicio"
                                value={fechaInicio}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeFechaInicio}
                            />
                        )}
                    </View>

                    <View>
                        <Text>Fecha de Fin:</Text>
                        <Pressable onPress={showModeFin} disabled={!isAdminUser}>
                            <TextInput
                                style={styles.input}
                                placeholder="Fecha de Fin"
                                value={formatDate(fechaFin)}
                                editable={false}
                            />
                        </Pressable>
                        {showDatePickerFin && (
                            <DateTimePicker
                                testID="dateTimePickerFin"
                                value={fechaFin}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onChangeFechaFin}
                            />
                        )}
                    </View>
                </>
            )}

            <TextInput
                style={styles.input}
                placeholder="Descripción"
                value={descripcion}
                onChangeText={setDescripcion}
                editable={isAdminUser}
            />
            <TextInput
                style={styles.input}
                placeholder="Límite de Fotos por Persona"
                value={limiteFotosPorPersona}
                onChangeText={setLimiteFotosPorPersona}
                keyboardType="number-pad"
                editable={isAdminUser}
            />

            <Pressable style={styles.imagePicker} onPress={selectImage} disabled={!isAdminUser}>
                <Text style={styles.imagePickerText}>Seleccionar Imagen del Concurso</Text>
            </Pressable>

            <Text>Imagen seleccionada: {imagenConcursoUrl}</Text>

            <Pressable style={styles.button} onPress={handleCrearConcurso} disabled={!isAdminUser}>
                <Text style={styles.textButton}>Crear</Text>
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

export default CrearConcurso;
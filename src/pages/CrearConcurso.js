import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Platform, Image } from 'react-native';
import PropTypes from 'prop-types';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import uploadImageToImgbb from '../services/imageService';
import { isAdmin } from '../services/authService';
import { createContest, getContest, updateContest } from '../services/contestService';
import { formatDate } from '../services/dateService';
import { Formik } from 'formik';
import { contestValidationSchema } from '../services/validationService';
import Toast from 'react-native-toast-message';

let DateTimePicker;
if (Platform.OS !== 'web') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const CrearConcurso = ({ currentUser }) => {
    const navigation = useNavigation();
    const route = useRoute();

    const [estado, setEstado] = useState('pendiente');
    const [serverError, setServerError] = useState('');
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
    const [showDatePickerFin, setShowDatePickerFin] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingContestId, setEditingContestId] = useState(null);
    
    const [formInitialValues, setFormInitialValues] = useState({
        nombreEvento: '',
        tema: '',
        fechaInicio: new Date(),
        fechaFin: new Date(),
        descripcion: '',
        limiteFotosPorPersona: 3,
        imagenConcursoUrl: '',
    });

    let DatePickerWeb = null;
    if (Platform.OS === 'web') {
        DatePickerWeb = require('react-datepicker').default;
        require('react-datepicker/dist/react-datepicker.css');
    }

    useEffect(() => {
        const concursoIdParam = route.params?.concursoId;
        if (concursoIdParam) {
            setIsEditMode(true);
            setEditingContestId(concursoIdParam);
            const fetchContestData = async () => {
                const { success, contest, error: fetchError } = await getContest(concursoIdParam);
                if (success && contest) {
                    const fInicio = contest.fechaInicio ? new Date(contest.fechaInicio) : new Date();
                    const fFin = contest.fechaFin ? new Date(contest.fechaFin) : new Date();
                    
                    setFormInitialValues({
                        nombreEvento: contest.nombreEvento || '',
                        tema: contest.tema || '',
                        fechaInicio: fInicio,
                        fechaFin: fFin,
                        descripcion: contest.descripcion || '',
                        limiteFotosPorPersona: parseInt(contest.limiteFotosPorPersona, 10) || 3,
                        imagenConcursoUrl: contest.imagenConcursoUrl || '',
                    });
                    setEstado(contest.estado || 'pendiente');
                } else {
                    setServerError(`Error al cargar datos del concurso: ${fetchError}`);
                    Toast.show({type: 'error', text1: "Error", text2: "No se pudieron cargar los datos del concurso para editar."});
                }
            };
            fetchContestData();
        } else {
            setFormInitialValues({
                nombreEvento: '',
                tema: '',
                fechaInicio: new Date(),
                fechaFin: new Date(),
                descripcion: '',
                limiteFotosPorPersona: 3,
                imagenConcursoUrl: '',
            });
            setEstado('pendiente');
        }
    }, [route.params?.concursoId]);

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

    const selectImage = async (setFieldValueFormik) => {
        if (Platform.OS === 'web') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        let base64Result = reader.result; 
                        const base64Marker = ';base64,';
                        const base64Idx = base64Result.indexOf(base64Marker);
                        let pureBase64String = '';
                        if (base64Idx !== -1) {
                            pureBase64String = base64Result.substring(base64Idx + base64Marker.length);
                        } else {
                            pureBase64String = base64Result;
                        }
                        try {
                            const url = await uploadImageToImgbb(pureBase64String);
                            if (url) {
                                setFieldValueFormik('imagenConcursoUrl', url);
                                setServerError('');
                            } else {
                                setServerError("Error al subir la imagen a ImgBB (URL no recibida).");
                                Toast.show({type:'error', text1:'Error Imagen', text2: 'No se pudo obtener la URL de la imagen.'});
                                setFieldValueFormik('imagenConcursoUrl', '');
                            }
                        } catch (uploadError) {
                            setServerError("Error crítico al subir la imagen.");
                            Toast.show({type:'error', text1:'Error Imagen', text2: 'Fallo crítico al subir imagen.'});
                            setFieldValueFormik('imagenConcursoUrl', '');
                        }
                    };
                    reader.onerror = (error) => {
                        setServerError("Error al procesar el archivo de imagen.");
                        Toast.show({type:'error', text1:'Error Imagen', text2: 'No se pudo procesar el archivo.'});
                        setFieldValueFormik('imagenConcursoUrl', '');
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

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const pureBase64FromMobile = result.assets[0].base64;
                try {
                    const url = await uploadImageToImgbb(pureBase64FromMobile);
                    if (url) {
                        setFieldValueFormik('imagenConcursoUrl', url);
                        setServerError('');
                    } else {
                        setServerError("Error al subir la imagen a ImgBB (móvil, URL no recibida).");
                        Toast.show({type:'error', text1:'Error Imagen', text2: 'No se pudo obtener la URL de la imagen (móvil).'});
                        setFieldValueFormik('imagenConcursoUrl', '');
                    }
                } catch (error) {
                    setServerError("Error crítico al subir la imagen (móvil).");
                    Toast.show({type:'error', text1:'Error Imagen', text2: 'Fallo crítico al subir imagen (móvil).'});
                    setFieldValueFormik('imagenConcursoUrl', '');
                }
            }
        }
    };
    
    const handleDateChange = (fieldName, selectedDate, setFieldValue) => {
        const currentDate = selectedDate || formInitialValues[fieldName];
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            setShowDatePickerInicio(false);
            setShowDatePickerFin(false);
        }
        setFieldValue(fieldName, currentDate);
    };

    const handleFormikSubmit = async (values, { setSubmitting, resetForm }) => {
        setServerError('');
        if (!isAdminUser) {
            setServerError('No tienes permisos para guardar concursos.');
            Toast.show({type: 'error', text1: 'Permiso Denegado', text2: 'No tienes permisos para esta acción.'});
            setSubmitting(false);
            return;
        }

        const contestData = {
            nombreEvento: values.nombreEvento,
            tema: values.tema,
            fechaInicio: values.fechaInicio instanceof Date ? values.fechaInicio.toISOString() : new Date(values.fechaInicio).toISOString(),
            fechaFin: values.fechaFin instanceof Date ? values.fechaFin.toISOString() : new Date(values.fechaFin).toISOString(),
            descripcion: values.descripcion,
            limiteFotosPorPersona: parseInt(values.limiteFotosPorPersona),
            imagenConcursoUrl: values.imagenConcursoUrl,
            estado: estado,
        };

        try {
            let success, id, errorMsg;
            if (isEditMode && editingContestId) {
                const result = await updateContest(editingContestId, contestData);
                success = result.success; errorMsg = result.error; id = editingContestId;
            } else {
                const result = await createContest({ ...contestData, creatorId: currentUser.uid, usersId: [] });
                success = result.success; id = result.id; errorMsg = result.error;
            }

            if (success) {
                Toast.show({type: 'success', text1: 'Éxito', text2: `Concurso ${isEditMode ? 'actualizado' : 'creado'} correctamente`});
                if (!isEditMode) {
                    resetForm();
                    setFormInitialValues({
                        nombreEvento: '', tema: '', fechaInicio: new Date(), fechaFin: new Date(),
                        descripcion: '', limiteFotosPorPersona: 3, imagenConcursoUrl: '',
                    });
                }
                navigation.navigate('FichaConcurso', { concursoId: id, timestamp: new Date().getTime() });
            } else {
                setServerError(errorMsg || 'Error desconocido al guardar el concurso.');
                Toast.show({type: 'error', text1: 'Error al Guardar', text2: errorMsg || 'No se pudo guardar el concurso.'});
            }
        } catch (e) {
            setServerError(`Excepción al ${isEditMode ? 'actualizar' : 'crear'} el concurso.`);
            Toast.show({type: 'error', text1: 'Error Crítico', text2: `Excepción: ${e.message || 'Error desconocido'}`});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={formInitialValues}
            validationSchema={contestValidationSchema}
            onSubmit={handleFormikSubmit}
            enableReinitialize={true}
        >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, isSubmitting, setFieldValue }) => (
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>{isEditMode ? 'Editar Concurso' : 'Crear Concurso'}</Text>

                    {serverError ? <Text style={styles.error}>{serverError}</Text> : null}
                    {!isAdminUser && <Text style={styles.error}>No tienes permisos para {isEditMode ? 'editar' : 'crear'} concursos.</Text>}

                    <TextInput
                        style={[styles.input, (touched.nombreEvento && errors.nombreEvento) && styles.inputError]}
                        placeholder="Nombre del Evento"
                        value={values.nombreEvento}
                        onChangeText={handleChange('nombreEvento')}
                        onBlur={handleBlur('nombreEvento')}
                        editable={isAdminUser}
                    />
                    {touched.nombreEvento && errors.nombreEvento && (<Text style={styles.errorText}>{errors.nombreEvento}</Text>)}
                    
                    <TextInput
                        style={[styles.input, styles.textArea, (touched.tema && errors.tema) && styles.inputError]}
                        placeholder="Tema del concurso"
                        value={values.tema}
                        onChangeText={handleChange('tema')}
                        onBlur={handleBlur('tema')}
                        editable={isAdminUser}
                        multiline={true}
                        numberOfLines={2}
                    />
                    {touched.tema && errors.tema && (<Text style={styles.errorText}>{errors.tema}</Text>)}

                    {Platform.OS === 'web' && DatePickerWeb ? (
                        <>
                            <Text style={styles.label}>Fecha de Inicio:</Text>
                            <DatePickerWeb
                                selected={values.fechaInicio}
                                onChange={(date) => setFieldValue('fechaInicio', date)}
                                dateFormat="yyyy-MM-dd"
                                disabled={!isAdminUser}
                                className={styles.datePickerWebInput}
                            />
                            {touched.fechaInicio && errors.fechaInicio && (<Text style={styles.errorText}>{errors.fechaInicio}</Text>)}

                            <Text style={styles.label}>Fecha de Fin:</Text>
                            <DatePickerWeb
                                selected={values.fechaFin}
                                onChange={(date) => setFieldValue('fechaFin', date)}
                                dateFormat="yyyy-MM-dd"
                                minDate={values.fechaInicio}
                                disabled={!isAdminUser}
                                className={styles.datePickerWebInput}
                            />
                            {touched.fechaFin && errors.fechaFin && (<Text style={styles.errorText}>{errors.fechaFin}</Text>)}
                        </>
                    ) : ( Platform.OS !== 'web' && DateTimePicker && 
                        <>
                            <View>
                                <Text style={styles.label}>Fecha de Inicio:</Text>
                                <Pressable onPress={() => isAdminUser && setShowDatePickerInicio(true)} disabled={!isAdminUser}>
                                    <TextInput
                                        style={[styles.input, (touched.fechaInicio && errors.fechaInicio) && styles.inputError]}
                                        value={formatDate(values.fechaInicio)}
                                        editable={false}
                                        placeholder="Seleccionar fecha de inicio"
                                    />
                                </Pressable>
                                {showDatePickerInicio && (
                                    <DateTimePicker
                                        value={values.fechaInicio}
                                        mode="date"
                                        display="default"
                                        onChange={(event, date) => handleDateChange('fechaInicio', date, setFieldValue)}
                                    />
                                )}
                                {touched.fechaInicio && errors.fechaInicio && (<Text style={styles.errorText}>{errors.fechaInicio}</Text>)}
                            </View>

                            <View>
                                <Text style={styles.label}>Fecha de Fin:</Text>
                                <Pressable onPress={() => isAdminUser && setShowDatePickerFin(true)} disabled={!isAdminUser}>
                                    <TextInput
                                        style={[styles.input, (touched.fechaFin && errors.fechaFin) && styles.inputError]}
                                        value={formatDate(values.fechaFin)}
                                        editable={false}
                                        placeholder="Seleccionar fecha de fin"
                                    />
                                </Pressable>
                                {showDatePickerFin && (
                                    <DateTimePicker
                                        value={values.fechaFin}
                                        mode="date"
                                        display="default"
                                        minimumDate={values.fechaInicio}
                                        onChange={(event, date) => handleDateChange('fechaFin', date, setFieldValue)}
                                    />
                                )}
                                {touched.fechaFin && errors.fechaFin && (<Text style={styles.errorText}>{errors.fechaFin}</Text>)}
                            </View>
                        </>
                    )}

                    <TextInput
                        style={[styles.input, styles.textArea, (touched.descripcion && errors.descripcion) && styles.inputError]}
                        placeholder="Descripción detallada del concurso"
                        value={values.descripcion}
                        onChangeText={handleChange('descripcion')}
                        onBlur={handleBlur('descripcion')}
                        editable={isAdminUser}
                        multiline
                        numberOfLines={4}
                    />
                    {touched.descripcion && errors.descripcion && (<Text style={styles.errorText}>{errors.descripcion}</Text>)}

                    <TextInput
                        style={[styles.input, (touched.limiteFotosPorPersona && errors.limiteFotosPorPersona) && styles.inputError]}
                        placeholder="Límite de Fotos por Persona (ej: 3)"
                        value={values.limiteFotosPorPersona.toString()}
                        onChangeText={(text) => setFieldValue('limiteFotosPorPersona', text === '' ? '' : parseInt(text, 10))}
                        onBlur={handleBlur('limiteFotosPorPersona')}
                        keyboardType="number-pad"
                        editable={isAdminUser}
                    />
                    {touched.limiteFotosPorPersona && errors.limiteFotosPorPersona && (<Text style={styles.errorText}>{errors.limiteFotosPorPersona}</Text>)}

                    <Pressable style={styles.imagePicker} onPress={() => selectImage(setFieldValue)} disabled={!isAdminUser}>
                        <Text style={styles.imagePickerText}>
                            {values.imagenConcursoUrl ? 'Cambiar Imagen del Concurso' : 'Seleccionar Imagen del Concurso'}
                        </Text>
                    </Pressable>
                    {touched.imagenConcursoUrl && errors.imagenConcursoUrl && !values.imagenConcursoUrl && 
                        (<Text style={styles.errorText}>{errors.imagenConcursoUrl}</Text>)}
                    
                    {values.imagenConcursoUrl ? (
                        <View style={styles.imagePreviewContainer}>
                            <Text>Imagen actual:</Text>
                            <Image source={{ uri: values.imagenConcursoUrl }} style={styles.imagePreview} />
                        </View>
                    ) : (
                        <Text style={styles.noImageText}>No se ha seleccionado imagen para el concurso.</Text>
                    )}

                    <Pressable 
                        style={[styles.button, (!isAdminUser || isSubmitting || !values.imagenConcursoUrl) && styles.buttonDisabled]} 
                        onPress={handleSubmit}
                        disabled={!isAdminUser || isSubmitting || !values.imagenConcursoUrl}
                    >
                        <Text style={styles.textButton}>{isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Concurso')}</Text>
                    </Pressable>
                </ScrollView>
            )}
        </Formik>
    );
};

CrearConcurso.propTypes = {
    currentUser: PropTypes.shape({
        uid: PropTypes.string.isRequired,
    }),
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f8f9fa',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        color: '#495057',
        marginBottom: 5,
        alignSelf: 'flex-start',
        marginLeft: 5,
    },
    input: {
        width: '100%',
        minHeight: 50,
        borderColor: '#ced4da',
        borderWidth: 1,
        paddingHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#495057',
        marginBottom: 5,
    },
    inputError: {
        borderColor: '#dc3545',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    datePickerWebInput: {
        width: '100%',
        minHeight: 50,
        borderColor: '#ced4da',
        borderWidth: 1,
        paddingHorizontal: 15,
        borderRadius: 8,
        backgroundColor: '#fff',
        fontSize: 16,
        color: '#495057',
        marginBottom: 5,
    },
    button: {
        backgroundColor: 'tomato',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        width: '90%',
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 15,
    },
    buttonDisabled: {
        backgroundColor: '#ffcccb',
    },
    textButton: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    error: {
        color: '#dc3545',
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: '500',
    },
    errorText: {
        fontSize: 13,
        color: '#dc3545',
        width: '100%',
        paddingLeft: 5,
        marginBottom: 10,
        marginTop: -2,
    },
    imagePicker: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        width: '90%',
        alignSelf: 'center',
    },
    imagePickerText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    imagePreviewContainer: {
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        borderRadius: 8,
        width: '90%',
    },
    imagePreview: {
        width: 250,
        height: 180,
        resizeMode: 'contain',
        borderRadius: 4,
    },
    noImageText: {
        textAlign: 'center',
        color: '#6c757d',
        marginBottom: 15,
        fontStyle: 'italic',
    }
});

export default CrearConcurso;
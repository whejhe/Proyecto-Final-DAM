import * as Yup from 'yup';

export const loginValidationSchema = Yup.object().shape({
    email: Yup.string()
        .email('Por favor, introduce un email válido')
        .required('El email es obligatorio'),
    password: Yup.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .required('La contraseña es obligatoria'),
});

export const registerValidationSchema = Yup.object().shape({
    nombreCompleto: Yup.string()
        .trim('El nombre no puede contener solo espacios al inicio o al final.')
        .min(3, 'El nombre completo debe tener al menos 3 caracteres válidos.')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/, 'El nombre solo puede contener letras y espacios.')
        .required('El nombre completo es obligatorio'),
    email: Yup.string()
        .email('Por favor, introduce un email válido')
        .required('El email es obligatorio'),
    password: Yup.string()
        .min(6, 'La contraseña debe tener al menos 6 caracteres')
        .required('La contraseña es obligatoria'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Las contraseñas deben coincidir')
        .required('Confirmar la contraseña es obligatorio'),
});

export const contestValidationSchema = Yup.object().shape({
    nombreEvento: Yup.string()
        .trim()
        .min(5, 'El nombre del evento debe tener al menos 5 caracteres.')
        .required('El nombre del evento es obligatorio.'),
    tema: Yup.string()
        .trim()
        .min(5, 'El tema del concurso debe tener al menos 5 caracteres.')
        .required('El tema es obligatorio.'),
    fechaInicio: Yup.date()
        .required('La fecha de inicio es obligatoria.')
        .typeError('Debe seleccionar una fecha de inicio válida.'),
    fechaFin: Yup.date()
        .required('La fecha de fin es obligatoria.')
        .typeError('Debe seleccionar una fecha de fin válida.')
        .min(Yup.ref('fechaInicio'), 'La fecha de fin no puede ser anterior a la fecha de inicio.'),
    fechaFinVotacion: Yup.date()
        .required('La fecha de fin de votación es obligatoria.')
        .typeError('Debe seleccionar una fecha de fin de votación válida.')
        .min(Yup.ref('fechaFin'), 'La fecha de fin de votación no puede ser anterior a la fecha de fin del concurso.'),
    descripcion: Yup.string()
        .trim()
        .min(10, 'La descripción debe tener al menos 10 caracteres.')
        .required('La descripción es obligatoria.'),
    imagenConcursoUrl: Yup.string()
        .url('Debe ser una URL válida para la imagen del concurso.')
        .required('La imagen del concurso es obligatoria.'),
});

import { parseDate } from './dateService'; // Asumiendo que parseDate convierte string a Date

/**
 * Calcula el tiempo restante hasta una fecha objetivo.
 * @param {string|Date} targetDateISO La fecha objetivo en formato ISO o como objeto Date.
 * @returns {object|null} Objeto con { days, hours, minutes, seconds, totalMilliseconds } o null si la fecha no es válida.
 */
export const calculateTimeRemaining = (targetDateISO) => {
    const targetTime = targetDateISO instanceof Date ? targetDateISO.getTime() : parseDate(targetDateISO)?.getTime();
    if (isNaN(targetTime)) {
        return null; // Fecha objetivo no válida
    }

    const now = new Date().getTime();
    const totalMilliseconds = targetTime - now;

    if (totalMilliseconds <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMilliseconds };
    }

    const days = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((totalMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((totalMilliseconds % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, totalMilliseconds };
};

/**
 * Formatea las partes del tiempo en una cadena legible.
 * @param {object} timeParts Objeto con { days, hours, minutes, seconds }.
 * @returns {string} Cadena de tiempo formateada (ej: "01D 02H 30M 15S").
 */
export const formatTimeRemaining = (timeParts) => {
    if (!timeParts || timeParts.totalMilliseconds <= 0) {
        return "00D 00H 00M 00S"; // O un mensaje como "Tiempo Expirado"
    }
    const d = String(timeParts.days).padStart(2, '0');
    const h = String(timeParts.hours).padStart(2, '0');
    const m = String(timeParts.minutes).padStart(2, '0');
    const s = String(timeParts.seconds).padStart(2, '0');
    return `${d}D ${h}H ${m}M ${s}S`;
};

/**
 * Determina la etiqueta y la fecha objetivo para el cronómetro según el estado del concurso.
 * @param {object} concurso El objeto del concurso con estado y fechas (fechaInicio, fechaFin, fechaFinVotacion).
 * @returns {object} Objeto con { label: string, targetDate: string|Date|null, isActive: boolean, message: string|null }
 */
export const getCountdownDetails = (concurso) => {
    if (!concurso || !concurso.estado) {
        return { label: "Cargando estado...", targetDate: null, isActive: false, message: null };
    }

    const now = new Date();
    const fechaInicio = concurso.fechaInicio ? parseDate(concurso.fechaInicio) : null;
    const fechaFin = concurso.fechaFin ? parseDate(concurso.fechaFin) : null;
    const fechaFinVotacion = concurso.fechaFinVotacion ? parseDate(concurso.fechaFinVotacion) : null;

    switch (concurso.estado) {
        case 'pendiente':
            if (fechaInicio && fechaInicio > now) {
                return { label: "El concurso comienza en:", targetDate: fechaInicio, isActive: true, message: null };
            }
            return { label: "Próximamente", targetDate: null, isActive: false, message: "El concurso está por iniciar." };
        case 'activo':
            if (fechaFin && fechaFin > now) {
                return { label: "Cierre de subida de fotos en:", targetDate: fechaFin, isActive: true, message: null };
            }
            return { label: "Periodo de subida finalizando...", targetDate: null, isActive:false, message: "Calculando siguiente fase."};
        case 'en votacion':
            if (fechaFinVotacion && fechaFinVotacion > now) {
                return { label: "La votación finaliza en:", targetDate: fechaFinVotacion, isActive: true, message: null };
            }
            return { label: "Periodo de votación finalizando...", targetDate: null, isActive: false, message: "Calculando siguiente fase." };
        case 'finalizado':
            return { label: "Concurso Finalizado", targetDate: null, isActive: false, message: null };
        default:
            return { label: "Estado desconocido", targetDate: null, isActive: false, message: "El estado del concurso no es claro." };
    }
}; 
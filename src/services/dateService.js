// Función para formatear una fecha
export const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Función para parsear una fecha
export const parseDate = (dateInput) => {
    if (!dateInput) return null;

    // Si es un objeto Timestamp de Firestore, conviértelo a Date
    if (dateInput && typeof dateInput.toDate === 'function') {
        try {
            return dateInput.toDate();
        } catch (error) {
            console.warn("Error converting Firestore Timestamp to Date:", dateInput, error);
            return null;
        }
    }

    // Si es un string, intenta parsearlo directamente
    // new Date() es bastante flexible con formatos ISO
    if (typeof dateInput === 'string') {
        const date = new Date(dateInput);
        // Verifica si el parseo fue exitoso (no es Invalid Date)
        if (!isNaN(date.getTime())) {
            return date;
        }
    }
    
    // Si es un número (milisegundos desde epoch), también es válido
    if (typeof dateInput === 'number') {
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    console.warn("Error parsing date input (unrecognized format or invalid date):", dateInput);
    return null;
};
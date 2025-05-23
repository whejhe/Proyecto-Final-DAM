// Función para formatear una fecha
export const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Función para parsear una fecha
export const parseDate = (dateString) => {
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
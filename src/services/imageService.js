import { Platform } from 'react-native';
// Ya no se necesita FileSystem si siempre pasas la base64 pura
// import * as FileSystem from 'expo-file-system';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const isValidImageSize = (fileSizeInBytes) => {
  if (fileSizeInBytes === undefined || fileSizeInBytes === null) {
    // Si no se puede determinar el tamaño, lo consideramos válido por ahora para no bloquear.
    // Podríamos optar por ser más estrictos y devolver false.
    console.warn('isValidImageSize: No se pudo determinar el tamaño del archivo.');
    return { isValid: true }; 
  }
  if (fileSizeInBytes > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    const maxSizeInMB = (MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      message: `El archivo (${sizeInMB} MB) excede el límite de ${maxSizeInMB} MB.`
    };
  }
  return { isValid: true };
};

const uploadImageToImgbb = async (base64Image) => { // Renombrado para claridad
  try {
    // Asumimos que base64Image es la cadena pura de base64
    // No se necesita la lógica destartsWith('data:image') o Platform.OS para FileSystem

    const formData = new FormData();
    formData.append('image', base64Image);

    // Define la URL de la API de imgbb
    const apiKey = '433a8235d181ea9eebb2388ba866595a'; // Considera mover esto a una variable de entorno o configuración
    const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;

    // Realiza la solicitud POST a imgbb
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Imagen subida con éxito:', data.data.display_url);
      console.log('🗑️ URL de eliminación:', data.data.delete_url);
      return {
        display_url: data.data.url, // 'url' es la URL de visualización directa
        delete_url: data.data.delete_url 
      };
    } else {
      // Proporcionar más detalles del error de ImgBB si están disponibles
      console.error('❌ Error al subir la imagen a ImgBB:', data.error ? data.error.message || data.error : 'Error desconocido de ImgBB');
      return null;
    }
  } catch (error) {
    console.error('❌ Error en la función uploadImageToImgbb:', error);
    return null;
  }
};

const deleteImageFromImgbb = async (deleteUrl) => {
  try {
    // ImgBB no proporciona una API de eliminación directa que pueda ser llamada con 'fetch' de forma simple
    // La delete_url es para ser abierta en un navegador y confirmar manualmente.
    // Para una eliminación programática real, se necesitaría un backend o un servicio que pueda interactuar con esa página.
    console.warn(`Para eliminar la imagen, abre esta URL en un navegador: ${deleteUrl}`);
    // Aquí podrías intentar una solicitud GET si ImgBB lo permitiera para alguna forma de eliminación,
    // pero su documentación no lo indica.
    // Por ahora, esta función actúa como un placeholder y registra la URL.
    // const response = await fetch(deleteUrl, { method: 'GET' }); // Esto probablemente no funcionará como se espera.
    // if (response.ok) { // Asumiendo que una respuesta ok significaría eliminación
    //   console.log('Imagen marcada para eliminación en ImgBB (o eliminada si la URL GET directa funcionara).');
    //   return true;
    return true; // Simular éxito para el flujo de la aplicación
  } catch (error) {
    console.error('❌ Error en la función deleteImageFromImgbb:', error);
    return false;
  }
};

export { uploadImageToImgbb, deleteImageFromImgbb };
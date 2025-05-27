import { Platform } from 'react-native';
// Ya no se necesita FileSystem si siempre pasas la base64 pura
// import * as FileSystem from 'expo-file-system';

const uploadImageToImgbb = async (base64Image) => { // Renombrado para claridad
  try {
    // Asumimos que base64Image es la cadena pura de base64
    // No se necesita la lógica destartsWith('data:image') o Platform.OS para FileSystem

    const formData = new FormData();
    formData.append('image', base64Image);

    // Define la URL de la API de imgbb
    const apiKey = '433a8235d181ea9eebb2388ba866595a';
    const url = `https://api.imgbb.com/1/upload?key=${apiKey}`;

    // Realiza la solicitud POST a imgbb
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Imagen subida con éxito:', data.data.url);
      return data.data.url;
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

export default uploadImageToImgbb;
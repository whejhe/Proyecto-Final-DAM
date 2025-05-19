import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const uploadImageToImgbb = async (imageUri) => {
  try {
    let base64Image = imageUri;

    // Verifica si imageUri es una URI de datos (base64)
    if (!imageUri.startsWith('data:image')) {
      // Verifica si la plataforma no es web antes de usar FileSystem
      if (Platform.OS !== 'web') {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
          // Lee el contenido del archivo como base64
          base64Image = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          console.error('❌ El archivo no existe:', imageUri);
          return null;
        }
      } else {
        // Si es la web, simplemente usa la URI de la imagen
        base64Image = imageUri;
      }
    } else {
      // Elimina el encabezado "data:image..." si está presente
      base64Image = base64Image.replace(/^data:image\/\w+;base64,/, '');
    }

    // Crea el cuerpo de la solicitud con la imagen codificada en base64
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
      console.error('❌ Error al subir la imagen:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error al subir la imagen:', error);
    return null;
  }
};

export default uploadImageToImgbb;
// src/config/cloudinaryUpload.js
import * as ImagePicker from 'expo-image-picker';

// Esta variable puede servir para construir URLs de imagen u otros usos en el futuro
export const CLOUDINARY_URL = "cloudinary://984767331399785:u6RZBfncoPw-8_JTQ4sBHkatThI@dds4melcf";

// Configuración específica de Cloudinary para las cargas
const CLOUDINARY_CONFIG = {
    cloudName: 'dds4melcf',
    uploadPreset: 'avatar_upload',
    uploadUrl: 'https://api.cloudinary.com/v1_1/dds4melcf/image/upload'
};

// Función helper para subir un blob a Cloudinary
async function uploadBlobToCloudinary(blob) {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);

    const res = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
        method: 'POST',
        body: formData,
    });

    const data = await res.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error('Error al subir la imagen: ' + JSON.stringify(data));
    }
}

// Función que recibe una URI de imagen y la sube a Cloudinary
export async function uploadImageToCloudinary(imageUri) {
    try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return await uploadBlobToCloudinary(blob);
    } catch (error) {
        console.error('Error en uploadImageToCloudinary:', error);
        throw error;
    }
}

// Función que permite seleccionar una imagen de la galería y luego subirla
export async function pickImageAndUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.IMAGES, // Antes era ImagePicker.MediaTypeOptions.Images
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        try {
            return await uploadImageToCloudinary(imageUri);
        } catch (err) {
            console.error('Error al subir la imagen:', err);
        }
    }
    return null;
}

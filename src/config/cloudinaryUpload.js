import Constants from 'expo-constants';

const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } = Constants.expoConfig.extra;

if (!CLOUDINARY_URL || !CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET || !CLOUDINARY_UPLOAD_URL) {
  throw new Error('Missing Cloudinary configuration in .env file');
}

// Función helper para subir un blob a Cloudinary
async function uploadBlobToCloudinary(blob) {
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

  const res = await fetch(CLOUDINARY_UPLOAD_URL, {
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


export const pickImageAndUpload = async (imageUri) => {
  try {
    let formData = new FormData();

    formData.append("file", {
      uri: imageUri,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    formData.append("upload_preset", "avatar_upload");
    formData.append("folder", "Avatars"); 

    let response = await fetch("https://api.cloudinary.com/v1_1/c6rlosfern6ndez/image/upload", {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json",
      },
    });

    let data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    throw error;
  }
};

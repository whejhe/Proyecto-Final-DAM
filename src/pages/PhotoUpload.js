// import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// async function uploadPhoto(user) {
//   const imageUrl = await pickImageAndUpload();
//   if (imageUrl) {
//     await addDoc(collection(FIRESTORE_DB, 'fotografias'), {
//       userId: user.uid,
//       imageUrl,
//       status: 'pendiente',
//       createdAt: serverTimestamp(),
//     });
//     // Notifica al usuario que la foto se ha subido y está pendiente de validación.
//   }
// }

const sharp = require('sharp');
const mime = require('mime-types');

// Función para procesar la imagen
// Función para procesar la imagen
const processImage = async (imageBuffer, originalFileName) => {
    // Determinar el tipo MIME del archivo basado en su extensión
    const mimeType = mime.lookup(originalFileName);
    if (!mimeType || !mimeType.startsWith('image/')) {
        throw new Error('El archivo no es una imagen válida.');
    }

    // Si el tipo MIME no es JPEG, convertirlo a JPEG
    if (!mimeType.endsWith('jpeg') && !mimeType.endsWith('jpg')) {
        const jpegBuffer = await sharp(imageBuffer)
            .jpeg()
            .toBuffer();

        return { buffer: jpegBuffer, ext: 'jpg' };
    }

    // Si ya es JPEG, mantenerlo como está
    return { buffer: imageBuffer, ext: 'jpg' };
};

module.exports = { processImage };

import Compressor from 'compressorjs';

/**
 * Compresses an image file using compressor.js.
 * Returns the original file if it's not an image, otherwise returns a compressed File.
 * 
 * @param {File} file - The file to compress.
 * @param {Object} options - Compressor.js options.
 * @returns {Promise<File>} - A promise that resolves to the compressed File.
 */
export const compressImage = (file, options = {}) => {
  // Only compress if the file is an image
  if (!file || !file.type.startsWith('image/')) {
    return Promise.resolve(file);
  }

  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.6, // Good default for web images
      maxWidth: 1200,
      maxHeight: 1200,
      mimeType: 'image/jpeg', // Force JPEG for better sizes
      convertSize: 0, // Convert all images (e.g. large PNGs) to JPEG to apply lossy compression
      ...options,
      success(result) {
        let finalName = file.name;
        // Ensure the file extension matches the new mime type
        if (result.type === 'image/jpeg' && !/\.jpe?g$/i.test(finalName)) {
          finalName = finalName.replace(/\.[^/.]+$/, "") + ".jpg";
        }

        // The result is a Blob. Convert it back to a File so it retains a name.
        const compressedFile = new File([result], finalName, {
          type: result.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      },
      error(err) {
        console.error('Image compression error:', err.message);
        reject(err);
      },
    });
  });
};
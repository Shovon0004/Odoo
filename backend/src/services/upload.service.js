const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'df805xy9a',
  api_key: process.env.CLOUDINARY_API_KEY || '635794159538533',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'YrOFOU2uaG_z37B0Ajp8ld5DHFA',
});

/**
 * Upload an image (base64 string or file URL/buffer) to Cloudinary
 * @param {string} imageStr - Base64 image data URI or URL
 * @param {string} folder - Folder name in Cloudinary
 */
const uploadImage = async (imageStr, folder = 'rental_products') => {
  try {
    if (!imageStr) {
      throw new Error('Image data is required for upload');
    }

    const result = await cloudinary.uploader.upload(imageStr, {
      folder: folder,
      resource_type: 'auto',
    });

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error.message);
    throw new Error(error.message || 'Failed to upload image to Cloudinary');
  }
};

module.exports = {
  uploadImage,
  cloudinary,
};

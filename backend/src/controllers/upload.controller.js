const uploadService = require('../services/upload.service');

const handleImageUpload = async (req, res, next) => {
  try {
    const { image, folder } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image data (base64 string or image URL) is required',
      });
    }

    const result = await uploadService.uploadImage(image, folder || 'rental_products');

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Image uploaded successfully to Cloudinary',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
};

module.exports = {
  handleImageUpload,
};

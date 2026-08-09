const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/', authenticateToken, uploadController.handleImageUpload);

module.exports = router;

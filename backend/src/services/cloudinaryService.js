/**
 * Cloudinary Service — Image upload, delete, and transform
 */
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary (lazy — only when credentials exist)
let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return true;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️  Cloudinary not configured. Image uploads will be stubbed.');
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isConfigured = true;
  return true;
}

/**
 * Multer memory storage for handling file uploads before sending to Cloudinary
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and SVG images are allowed'), false);
    }
  },
});

/**
 * Upload an image buffer to Cloudinary
 * @param {Buffer} buffer - The image buffer
 * @param {string} folder - Cloudinary folder (e.g., 'tableflow/logos')
 * @param {string} publicId - Optional public ID
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadImage(buffer, folder = 'tableflow', publicId = null) {
  if (!ensureConfigured()) {
    console.log(`🖼️ [CLOUDINARY STUB] Upload to ${folder}`);
    return {
      url: `https://via.placeholder.com/400x200?text=${folder}`,
      publicId: 'stub_' + Date.now(),
      stubbed: true,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
      ],
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary
 */
async function deleteImage(publicId) {
  if (!ensureConfigured()) {
    console.log(`🖼️ [CLOUDINARY STUB] Delete: ${publicId}`);
    return { stubbed: true };
  }

  return cloudinary.uploader.destroy(publicId);
}

module.exports = {
  upload,
  uploadImage,
  deleteImage,
};

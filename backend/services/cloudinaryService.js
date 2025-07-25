require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'edloop-attachments', // Folder name in Cloudinary
    allowed_formats: [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // Documents
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Text files
      'txt', 'md', 'rtf', 'csv',
      // Archives
      'zip', 'rar', '7z',
      // Others
      'mp3', 'mp4', 'avi', 'mov'
    ],
    resource_type: 'auto', // Let Cloudinary auto-detect
    public_id: (req, file) => {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      return `${timestamp}-${randomString}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // List of allowed file extensions
    const allowedExtensions = [
      // Images
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      // Documents
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      // Text files
      'txt', 'md', 'rtf', 'csv', 'odt', 'ods', 'odp',
      // Archives
      'zip', 'rar', '7z',
      // Media
      'mp3', 'mp4', 'avi', 'mov'
    ];

    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
  },
});

// Helper function to delete file from Cloudinary
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get file info
const getFileInfo = (cloudinaryResult) => {
  return {
    name: cloudinaryResult.original_filename || 'unnamed',
    url: cloudinaryResult.secure_url,
    publicId: cloudinaryResult.public_id,
    type: cloudinaryResult.format,
    size: cloudinaryResult.bytes,
    resourceType: cloudinaryResult.resource_type,
    uploaded_at: new Date()
  };
};

module.exports = {
  cloudinary,
  upload,
  deleteFile,
  getFileInfo
};

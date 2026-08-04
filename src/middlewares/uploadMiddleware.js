import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import fs from 'fs';
import path from 'path';

// Check if credentials are ready
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;

if (isCloudinaryConfigured) {
  // Configure Cloudinary engine
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'civic_issues',
      allowed_formats: ['jpg', 'png', 'jpeg'],
      transformation: [{ width: 1024, height: 768, crop: 'limit' }],
    },
  });
  console.log('☁️  Muli-storage: Cloudinary environment verified and loaded.');
} else {
  // Local storage fallback setup
  const localUploadPath = 'public/uploads';
  
  if (!fs.existsSync(localUploadPath)) {
    fs.mkdirSync(localUploadPath, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, localUploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
  console.log('📁  Multi-storage: Cloudinary key missing. Configured Local Folder disk storage.');
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Format not supported! Please upload images only.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
});

export default upload;
export { isCloudinaryConfigured };

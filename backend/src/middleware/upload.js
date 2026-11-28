const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Private storage for sensitive identity/title documents — not publicly accessible
function makePrivateStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `hausfindrr/${folder}`,
      resource_type: 'auto',
      type: 'private',
      public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }),
  });
}

// Public storage for property listing photos
function makePublicStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder: `hausfindrr/${folder}`,
      resource_type: 'image',
      type: 'upload',
      public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }),
  });
}

const documentUpload = multer({
  storage: makePrivateStorage('documents'),
  fileFilter: (req, file, cb) => cb(null, ALLOWED_DOC_TYPES.includes(file.mimetype)),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const photoUpload = multer({
  storage: makePublicStorage('photos'),
  fileFilter: (req, file, cb) => cb(null, ALLOWED_PHOTO_TYPES.includes(file.mimetype)),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const avatarUpload = multer({
  storage: makePublicStorage('avatars'),
  fileFilter: (req, file, cb) => cb(null, ALLOWED_PHOTO_TYPES.includes(file.mimetype)),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const propertyUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      if (file.fieldname === 'title_documents') {
        return {
          folder: 'hausfindrr/documents',
          resource_type: 'auto',
          type: 'private',
          public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        };
      }
      return {
        folder: 'hausfindrr/photos',
        resource_type: 'image',
        type: 'upload',
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'title_documents') {
      cb(null, ALLOWED_DOC_TYPES.includes(file.mimetype));
    } else {
      cb(null, ALLOWED_PHOTO_TYPES.includes(file.mimetype));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { cloudinary, documentUpload, photoUpload, propertyUpload, avatarUpload };

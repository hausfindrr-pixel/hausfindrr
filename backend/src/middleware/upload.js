const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

function makeStorage(subfolder) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Used for landlord registration: single id_document field
const documentUpload = multer({
  storage: makeStorage('documents'),
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_DOC_TYPES.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const photoUpload = multer({
  storage: makeStorage('photos'),
  fileFilter: (req, file, cb) => {
    cb(null, ALLOWED_PHOTO_TYPES.includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Combined upload for property creation: photos + title docs
const propertyUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const subfolder = file.fieldname === 'title_documents' ? 'documents' : 'photos';
      const dir = path.join(__dirname, '../../uploads', subfolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}${ext}`);
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

module.exports = { documentUpload, photoUpload, propertyUpload };

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

module.exports = { documentUpload, photoUpload };

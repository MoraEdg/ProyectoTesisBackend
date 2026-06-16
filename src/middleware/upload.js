const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const { v4: uuidv4 } = require('uuid');

function crearStorage(destino) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destino),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    }
  });
}

exports.uploadDocumento = multer({
  storage: crearStorage('./uploads/documentos'),
  limits: { fileSize: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '20') * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Validación de extensión se hace en el controller después del upload
    cb(null, true);
  }
}).single('archivo');

exports.uploadConvenio = multer({
  storage: crearStorage('./uploads/convenios'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const permitidos = ['.pdf', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, permitidos.includes(ext));
  }
}).single('archivo');

const TMP_DIR = './uploads/tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

exports.uploadExcel = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, TMP_DIR),
    filename:    (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.xlsm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls, .xlsm)'), false);
    }
  },
}).single('archivo');

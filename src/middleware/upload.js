const multer = require('multer');
const path   = require('path');
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

exports.uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ['.xlsx', '.xls'].includes(ext));
  }
}).single('archivo');

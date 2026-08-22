const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

// ─── MIDDLEWARE GLOBAL ────────────────────────────────────────────────────────
const ORIGENES_DEV = ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN || 'https://tu-dominio.uisek.edu.ec'
    : ORIGENES_DEV,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── RUTAS ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      require('./modules/auth/auth.routes'));
app.use('/api/v1/catalogos', require('./modules/catalogos/catalogos.routes'));
app.use('/api/v1/estudiantes', require('./modules/estudiantes/estudiantes.routes'));
app.use('/api/v1/tramites',    require('./modules/tramites/tramites.routes'));
app.use('/api/v1/hitos',       require('./modules/hitos/hitos.routes'));
app.use('/api/v1/documentos',  require('./modules/documentos/documentos.routes'));
app.use('/api/v1/generacion',  require('./modules/generacion/generacion.routes'));
app.use('/api/v1/convenios',  require('./modules/convenios/convenios.routes'));
app.use('/api/v1/reportes',   require('./modules/reportes/reportes.routes'));
app.use('/api/v1/permisos',   require('./modules/permisos/permisos.routes'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando', version: '1.0.0' });
});

// ─── RUTA NO ENCONTRADA ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ─── MANEJADOR DE ERRORES GLOBAL ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
});

module.exports = app;

require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('PostgreSQL conectado');
  }
});

pool.on('error', (err) => {
  console.error('Error en pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;

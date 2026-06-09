require("dotenv").config();
const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function iniciar() {
  try {
    await pool.query("SELECT NOW()");
    console.log(" Conexión a PostgreSQL verificada");

    app.listen(PORT, () => {
      console.log(` Servidor corriendo en http://localhost:${PORT}`);
      console.log(` Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error(" No se pudo conectar a PostgreSQL:", err.message);
    process.exit(1);
  }
}

iniciar();

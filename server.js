// server.js
// Backend del generador de comprobantes de la A.A.Z.
// Sirve el sitio (carpeta /public) y expone una API que asigna
// el número de recibo correlativo.
//
// La base de datos es Turso (SQLite en la nube, plan gratis, sin
// límite de tiempo). El cliente @libsql/client es JavaScript puro
// (no compila nada nativo), así que instala y corre en cualquier
// hosting con Node, incluido el plan gratis de Render.

const path = require('path');
const express = require('express');
const { createClient } = require('@libsql/client');

const PORT = process.env.PORT || 3000;

// Estas dos variables las tenés que configurar en Render (o en tu
// archivo .env si lo corrés local) con los datos de tu base de Turso.
// Ver README para el paso a paso de cómo conseguirlas.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Base de datos ----------
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recibos (
      numero      INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha       TEXT NOT NULL,
      estado      TEXT NOT NULL,
      metodo      TEXT NOT NULL,
      socio       TEXT NOT NULL,
      socio_num   TEXT,
      items       TEXT NOT NULL,
      total       REAL NOT NULL,
      emitido_en  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ---------- API ----------

// Emite un recibo nuevo: guarda los datos y devuelve el número asignado.
// El número lo pone la base de datos (AUTOINCREMENT), así que dos
// personas emitiendo un recibo al mismo tiempo nunca chocan de número.
app.post('/api/recibos', async (req, res) => {
  const { fecha, estado, metodo, socio, socioNum, items, total } = req.body || {};

  if (!fecha || !estado || !metodo || !socio || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Faltan datos obligatorios del recibo.' });
  }

  try {
    const result = await db.execute({
      sql: `INSERT INTO recibos (fecha, estado, metodo, socio, socio_num, items, total)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [fecha, estado, metodo, socio, socioNum || null, JSON.stringify(items), Number(total) || 0]
    });

    const numero = Number(result.lastInsertRowid);
    res.json({ numero, numeroFormateado: String(numero).padStart(4, '0') });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo registrar el recibo.' });
  }
});

// Lista los recibos emitidos (para un futuro panel/historial).
app.get('/api/recibos', async (req, res) => {
  const result = await db.execute('SELECT * FROM recibos ORDER BY numero DESC');
  res.json(result.rows.map(r => ({ ...r, items: JSON.parse(r.items) })));
});

// Devuelve un recibo puntual por número (útil para reimprimir).
app.get('/api/recibos/:numero', async (req, res) => {
  const result = await db.execute({
    sql: 'SELECT * FROM recibos WHERE numero = ?',
    args: [req.params.numero]
  });
  if (result.rows.length === 0) return res.status(404).json({ error: 'No existe ese recibo.' });
  const recibo = result.rows[0];
  res.json({ ...recibo, items: JSON.parse(recibo.items) });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AAZ Recibos escuchando en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });

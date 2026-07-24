// seed-socios.js
// Carga (o actualiza) el listado de socios en la base de Turso.
// Se corre UNA VEZ (o cada vez que cambie el listado del club).
//
// Uso:
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node seed-socios.js
//
// O si ya tenés un archivo .env con esas variables:
//   node -r dotenv/config seed-socios.js

const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// Listado de socios de la A.A.Z. (extraído de
// "Listado_de_socios_recibo_de_pago.xlsx"). Para agregar, sacar o
// corregir un socio, editá este array y volvé a correr el script.
const socios = [
  { numero: 1, nombre: "Arana Enrique" },
  { numero: 2, nombre: "Avallone Eduardo" },
  { numero: 3, nombre: "Balvidares Luciano" },
  { numero: 4, nombre: "Bossi Luis" },
  { numero: 5, nombre: "Brizuela Tirso" },
  { numero: 6, nombre: "Buceta Victoria" },
  { numero: 7, nombre: "Benitez Jesus" },
  { numero: 8, nombre: "Berutti Martel C" },
  { numero: 9, nombre: "Besone Ariel" },
  { numero: 10, nombre: "Bezenzette Eduardo" },
  { numero: 11, nombre: "Botta Antonio" },
  { numero: 12, nombre: "Bruno Federico" },
  { numero: 13, nombre: "Bruno Juan Manuel" },
  { numero: 14, nombre: "Carluccio Emiliano" },
  { numero: 15, nombre: "Cavalli Leo" },
  { numero: 16, nombre: "Cirulli Diego" },
  { numero: 17, nombre: "Cormack Gabriel" },
  { numero: 18, nombre: "Crosio Leonardo" },
  { numero: 19, nombre: "Del Alamo Diego" },
  { numero: 20, nombre: "Del Alamo Nicolas" },
  { numero: 21, nombre: "De la Lama Nahuel" },
  { numero: 22, nombre: "Deppert Ricardo" },
  { numero: 23, nombre: "Dome Alejandro" },
  { numero: 24, nombre: "Dopaso Eduardo" },
  { numero: 25, nombre: "Fasanella Fernando" },
  { numero: 26, nombre: "Felix Jorge" },
  { numero: 27, nombre: "Fenior Samuel" },
  { numero: 28, nombre: "Frisco Cristian" },
  { numero: 29, nombre: "Gimenez Guillermo" },
  { numero: 30, nombre: "GoyaOlivares Maximiliano" },
  { numero: 31, nombre: "Karnicic Norberto" },
  { numero: 32, nombre: "Kukanja Gustavo" },
  { numero: 33, nombre: "Landoni Ricardo" },
  { numero: 34, nombre: "Leone Roberto" },
  { numero: 35, nombre: "Maceira Carlos" },
  { numero: 36, nombre: "Marino Emanuel" },
  { numero: 37, nombre: "Marinosci Alvaro" },
  { numero: 38, nombre: "Oberti Carlos" },
  { numero: 39, nombre: "Pacheco Cristian" },
  { numero: 40, nombre: "Penalba Nestor" },
  { numero: 41, nombre: "Pennisi Gustavo" },
  { numero: 42, nombre: "Peralta Leandro" },
  { numero: 43, nombre: "Peralta Oscar" },
  { numero: 44, nombre: "Perez Mario" },
  { numero: 45, nombre: "Pignataro Claudio" },
  { numero: 46, nombre: "Pucciarelli Federico" },
  { numero: 47, nombre: "Ramirez Osmar" },
  { numero: 48, nombre: "Romagnoli Carlos" },
  { numero: 49, nombre: "Quevedo Miguel" },
  { numero: 50, nombre: "Salazar Rodrigo" },
  { numero: 51, nombre: "Santorsola Oscar" },
  { numero: 52, nombre: "Serra Daniel" },
  { numero: 53, nombre: "Spelge Eduardo" },
  { numero: 54, nombre: "Suarez Matias" },
  { numero: 55, nombre: "Tevrizan Marcelo" },
  { numero: 56, nombre: "Trossero Cristian" },
  { numero: 57, nombre: "Ueki Jose" },
  { numero: 58, nombre: "Valiente Daniel" },
  { numero: 59, nombre: "Van Dijk luis" },
  { numero: 60, nombre: "Verderi Javier" },
  { numero: 61, nombre: "Villagra Ezequiel" },
  { numero: 62, nombre: "Zatti ezequiel" },
  { numero: 63, nombre: "Zolezzi Mauro" },
  { numero: 64, nombre: "Martin Anibal" },
  { numero: 65, nombre: "Gomez Omar" },
  { numero: 66, nombre: "De la Lama Lucia" },
  { numero: 67, nombre: "Zolezzi Constantino" },
  { numero: 68, nombre: "Tartara Miguel" },
  { numero: 69, nombre: "Espanon Leonardo" },
  { numero: 70, nombre: "Lucas Crosio" },
  { numero: 71, nombre: "Garcia Jose" },
  { numero: 72, nombre: "Blazina Juan Carlos" },
  { numero: 73, nombre: "Peirano Agustin" }
];

async function main() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS socios (
      numero  INTEGER PRIMARY KEY,
      nombre  TEXT NOT NULL
    );
  `);

  for (const s of socios) {
    await db.execute({
      sql: 'INSERT INTO socios (numero, nombre) VALUES (?, ?) ON CONFLICT(numero) DO UPDATE SET nombre = excluded.nombre',
      args: [s.numero, s.nombre]
    });
  }

  console.log(`Listo: ${socios.length} socios cargados/actualizados en la base.`);
}

main().catch(err => {
  console.error('Error cargando socios:', err);
  process.exit(1);
});

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const config = require('./config');

// Neon (plan gratuito) suspende su base tras unos minutos sin uso y la primera
// conexión al despertar puede tardar o cortarse. Por eso: tiempo de espera
// propio, conexiones inactivas de vida corta y keep-alive.
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 5,
  connectionTimeoutMillis: 20000,
  idleTimeoutMillis: 10000,
  keepAlive: true,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en una conexión inactiva:', err.message);
});

/** Crea el tipo y la tabla si no existen (idempotente). */
async function inicializarEsquema() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { pool, inicializarEsquema };

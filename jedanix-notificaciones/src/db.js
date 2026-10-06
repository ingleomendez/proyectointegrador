'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({ connectionString: config.databaseUrl });

pool.on('error', (err) => {
  console.error('[db] Error inesperado en una conexión inactiva:', err.message);
});

/** Crea el tipo y la tabla si no existen (idempotente). */
async function inicializarEsquema() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { pool, inicializarEsquema };

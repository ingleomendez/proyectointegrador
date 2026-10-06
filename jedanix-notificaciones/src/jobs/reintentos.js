'use strict';

const config = require('../config');
const servicio = require('../services/notificacionService');

let temporizador = null;
let ejecutando = false;

/** Un ciclo: reprocesa las notificaciones FALLIDA (o PENDIENTE huérfanas) con intentos disponibles. */
async function ejecutarCiclo() {
  if (ejecutando) return; // evita solapar ciclos si uno tarda más que el intervalo
  ejecutando = true;
  try {
    const ids = await servicio.pendientesDeReintento();
    for (const id of ids) {
      const resultado = await servicio.procesar(id);
      console.log(`[reintentos] Notificación #${id}: ${resultado}`);
    }
  } catch (err) {
    console.error('[reintentos] Error en el ciclo:', err.message);
  } finally {
    ejecutando = false;
  }
}

function iniciar() {
  const cadaMs = config.reintentos.intervaloSegundos * 1000;
  temporizador = setInterval(ejecutarCiclo, cadaMs);
  temporizador.unref(); // no impide que el proceso termine
  console.log(
    `[reintentos] Job activo: cada ${config.reintentos.intervaloSegundos}s, máximo ${config.reintentos.maxIntentos} intentos por notificación.`,
  );
}

function detener() {
  if (temporizador) clearInterval(temporizador);
  temporizador = null;
}

module.exports = { iniciar, detener, ejecutarCiclo };

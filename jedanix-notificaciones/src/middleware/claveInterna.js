'use strict';

const crypto = require('crypto');

// Compara en tiempo constante (hash previo para igualar longitudes).
function iguales(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/**
 * Protege las rutas internas con una clave compartida entre el Núcleo y este
 * servicio (cabecera `X-API-Key`). Si `claveEsperada` está vacía no exige nada,
 * para que el desarrollo local siga funcionando sin configuración extra.
 */
function requiereClaveInterna(claveEsperada) {
  return (req, res, next) => {
    if (!claveEsperada) return next();
    const recibida = String(req.headers['x-api-key'] || '');
    if (!recibida || !iguales(recibida, claveEsperada)) {
      return res.status(401).json({ detail: 'Clave de servicio inválida o ausente.' });
    }
    return next();
  };
}

module.exports = { requiereClaveInterna };

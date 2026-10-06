'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { requiereClaveInterna } = require('../src/middleware/claveInterna');

function ejecutar(claveEsperada, cabeceras) {
  let siguio = false;
  let estado = null;
  let cuerpo = null;
  const res = {
    status(codigo) { estado = codigo; return this; },
    json(datos) { cuerpo = datos; return this; },
  };
  requiereClaveInterna(claveEsperada)({ headers: cabeceras }, res, () => { siguio = true; });
  return { siguio, estado, cuerpo };
}

test('sin clave configurada deja pasar todo (modo desarrollo)', () => {
  assert.strictEqual(ejecutar('', {}).siguio, true);
});

test('con clave configurada rechaza la petición sin cabecera', () => {
  const r = ejecutar('secreta', {});
  assert.strictEqual(r.siguio, false);
  assert.strictEqual(r.estado, 401);
  assert.ok(r.cuerpo.detail);
});

test('con clave configurada rechaza una clave incorrecta', () => {
  const r = ejecutar('secreta', { 'x-api-key': 'otra' });
  assert.strictEqual(r.siguio, false);
  assert.strictEqual(r.estado, 401);
});

test('con clave configurada acepta la clave correcta', () => {
  const r = ejecutar('secreta', { 'x-api-key': 'secreta' });
  assert.strictEqual(r.siguio, true);
  assert.strictEqual(r.estado, null);
});

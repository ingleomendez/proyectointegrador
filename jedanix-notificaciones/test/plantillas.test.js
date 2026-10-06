'use strict';

const test = require('node:test');
const assert = require('node:assert');
const plantillas = require('../src/services/plantillas');

// Eventos que hoy emite el Núcleo de Prácticas.
const EVENTOS_DEL_NUCLEO = [
  'usuario.creado', 'usuario.credenciales_reenviadas', 'usuario.reactivado', 'postulacion.enviada', 'postulacion.aprobada',
  'postulacion.rechazada', 'practica.cerrada', 'practica.cierre_rechazado', 'avance.registrado',
  'avance.calificado', 'avance.observado', 'avance.observacion_docente', 'objetivos.pendientes',
  'objetivos.aprobados', 'objetivos.rechazados',
];

test('hay plantilla para cada evento que emite el Núcleo', () => {
  for (const evento of EVENTOS_DEL_NUCLEO) {
    assert.ok(plantillas.esEventoSoportado(evento), `falta la plantilla de ${evento}`);
  }
});

test('toda plantilla produce un mensaje válido incluso con datos vacíos', () => {
  for (const evento of plantillas.eventosSoportados()) {
    const m = plantillas.renderizar(evento, {}, 'alguien@udi.edu.co');
    assert.ok(m.asunto.length > 0 && m.texto.length > 0 && m.html.includes('JEDANIX'), evento);
    assert.ok(!m.texto.includes('undefined'), `${evento} deja "undefined" en el texto`);
  }
});

test('usuario.creado incluye correo y contraseña temporal', () => {
  const m = plantillas.renderizar(
    'usuario.creado', { nombre_completo: 'Ana Pérez', password_temporal: 'Abc123xyz789' }, 'ana@udi.edu.co',
  );
  assert.match(m.texto, /Ana Pérez/);
  assert.match(m.texto, /ana@udi\.edu\.co/);
  assert.match(m.texto, /Abc123xyz789/);
  assert.match(m.html, /Abc123xyz789/);
});

test('usuario.credenciales_reenviadas incluye la contraseña temporal nueva', () => {
  const m = plantillas.renderizar(
    'usuario.credenciales_reenviadas', { nombre_completo: 'Ana Pérez', password_temporal: 'Nueva456abc' }, 'ana@udi.edu.co',
  );
  assert.match(m.texto, /ana@udi\.edu\.co/);
  assert.match(m.texto, /Nueva456abc/);
  assert.match(m.html, /Nueva456abc/);
});

test('el HTML escapa el contenido que viene en los datos', () => {
  const m = plantillas.renderizar('postulacion.rechazada', { motivo: '<script>alert(1)</script>' }, 'a@b.co');
  assert.ok(!m.html.includes('<script>'));
  assert.match(m.html, /&lt;script&gt;/);
});

test('sinCamposSensibles quita la contraseña temporal', () => {
  const limpio = plantillas.sinCamposSensibles({ nombre_completo: 'Ana', password_temporal: 'secreto' });
  assert.deepStrictEqual(limpio, { nombre_completo: 'Ana' });
});

test('un evento desconocido no está soportado', () => {
  assert.strictEqual(plantillas.esEventoSoportado('evento.inventado'), false);
  assert.strictEqual(plantillas.esEventoSoportado('constructor'), false);
});

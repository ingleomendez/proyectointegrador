import { Routes } from '@angular/router';

/** Coordinador de Práctica (CU-09): menú "Estudiantes" → estudiante →
 * historial de avances → detalle del avance (calificar u observar). */
export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../inicio/inicio-rol').then((m) => m.InicioRol),
  },
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('../revision/estudiantes-lista/estudiantes-lista').then((m) => m.EstudiantesLista),
  },
  {
    path: 'estudiantes/:postulacionId',
    loadComponent: () =>
      import('../revision/estudiante-detalle/estudiante-detalle').then((m) => m.EstudianteDetalle),
  },
  {
    path: 'estudiantes/:postulacionId/avances/:id',
    loadComponent: () =>
      import('../revision/avance-revision/avance-revision').then((m) => m.AvanceRevision),
  },
];

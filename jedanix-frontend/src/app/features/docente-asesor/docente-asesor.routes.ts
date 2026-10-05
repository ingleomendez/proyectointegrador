import { Routes } from '@angular/router';

/** Docente Asesor (CU-10 y CU-11): menú "Estudiantes" → estudiante (objetivos
 * pendientes e historial de avances) → detalle del avance (observación). */
export const DOCENTE_ASESOR_ROUTES: Routes = [
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

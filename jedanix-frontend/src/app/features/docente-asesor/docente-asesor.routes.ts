import { Routes } from '@angular/router';

export const DOCENTE_ASESOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../inicio/inicio-rol').then((m) => m.InicioRol),
  },
  // CU-11: decidir los objetivos de práctica
  {
    path: 'objetivos',
    loadComponent: () =>
      import('./objetivos-pendientes/objetivos-pendientes').then((m) => m.ObjetivosPendientes),
  },
  // CU-10: observar los avances semanales
  {
    path: 'avances',
    loadComponent: () =>
      import('../revision/avances-revision-lista/avances-revision-lista').then(
        (m) => m.AvancesRevisionLista,
      ),
  },
  {
    path: 'avances/:id',
    loadComponent: () =>
      import('../revision/avance-revision/avance-revision').then((m) => m.AvanceRevision),
  },
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('../revision/estudiantes-lista/estudiantes-lista').then((m) => m.EstudiantesLista),
  },
];

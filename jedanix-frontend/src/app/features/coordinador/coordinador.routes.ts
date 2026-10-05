import { Routes } from '@angular/router';

export const COORDINADOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../inicio/inicio-rol').then((m) => m.InicioRol),
  },
  // CU-09: calificar u observar los avances semanales
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

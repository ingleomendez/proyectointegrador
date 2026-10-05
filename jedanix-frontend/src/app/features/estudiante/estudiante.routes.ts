import { Routes } from '@angular/router';

export const ESTUDIANTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'empresas',
    loadComponent: () =>
      import('./empresas/empresas-lista/empresas-lista').then((m) => m.EmpresasLista),
  },
  {
    path: 'empresas/:id',
    loadComponent: () =>
      import('./empresas/empresa-detalle/empresa-detalle').then((m) => m.EmpresaDetalle),
  },
  {
    path: 'postulaciones',
    loadComponent: () =>
      import('./postulaciones/postulaciones-lista/postulaciones-lista').then(
        (m) => m.PostulacionesLista,
      ),
  },
  {
    path: 'postulaciones/nueva/:empresaId',
    loadComponent: () =>
      import('./postulaciones/postulacion-nueva/postulacion-nueva').then(
        (m) => m.PostulacionNueva,
      ),
  },
  {
    path: 'postulaciones/:id',
    loadComponent: () =>
      import('./postulaciones/postulacion-detalle/postulacion-detalle').then(
        (m) => m.PostulacionDetalle,
      ),
  },
  {
    path: 'objetivos',
    loadComponent: () => import('./objetivos/objetivos').then((m) => m.Objetivos),
  },
];

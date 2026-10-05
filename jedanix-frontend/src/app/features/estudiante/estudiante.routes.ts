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
    path: 'mi-practica',
    loadComponent: () => import('./mi-practica/mi-practica').then((m) => m.MiPractica),
  },
  {
    path: 'avances',
    loadComponent: () =>
      import('./avances/avances-lista/avances-lista').then((m) => m.AvancesLista),
  },
  {
    path: 'avances/nuevo',
    loadComponent: () => import('./avances/avance-nuevo/avance-nuevo').then((m) => m.AvanceNuevo),
  },
  {
    path: 'avances/:id/corregir',
    loadComponent: () => import('./avances/avance-nuevo/avance-nuevo').then((m) => m.AvanceNuevo),
  },
  {
    path: 'avances/:id',
    loadComponent: () =>
      import('./avances/avance-detalle/avance-detalle').then((m) => m.AvanceDetalle),
  },
  {
    path: 'objetivos',
    loadComponent: () => import('./objetivos/objetivos').then((m) => m.Objetivos),
  },
];

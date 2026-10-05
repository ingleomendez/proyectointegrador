import { Routes } from '@angular/router';

/** Rutas del Estudiante. Los nombres siguen las opciones de menú de los casos de uso:
 * "Solicitud de práctica" (CU-06), "Mi Práctica" (CU-07), "Objetivos" (CU-11) y
 * "Seguimiento Prácticas" (CU-08). */
export const ESTUDIANTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../inicio/inicio-rol').then((m) => m.InicioRol),
  },
  // CU-06: Solicitud de práctica (listado de empresas -> detalle -> postulación en 3 vistas)
  {
    path: 'solicitud',
    loadComponent: () =>
      import('./empresas/empresas-lista/empresas-lista').then((m) => m.EmpresasLista),
  },
  {
    path: 'solicitud/empresa/:id',
    loadComponent: () =>
      import('./empresas/empresa-detalle/empresa-detalle').then((m) => m.EmpresaDetalle),
  },
  {
    path: 'solicitud/postular/:empresaId',
    loadComponent: () =>
      import('./postulaciones/postulacion-nueva/postulacion-nueva').then(
        (m) => m.PostulacionNueva,
      ),
  },
  {
    path: 'solicitud/:id',
    loadComponent: () =>
      import('./postulaciones/postulacion-nueva/postulacion-nueva').then(
        (m) => m.PostulacionNueva,
      ),
  },
  // CU-07: Mi Práctica
  {
    path: 'mi-practica',
    loadComponent: () => import('./mi-practica/mi-practica').then((m) => m.MiPractica),
  },
  // CU-11: Objetivos
  {
    path: 'objetivos',
    loadComponent: () => import('./objetivos/objetivos').then((m) => m.Objetivos),
  },
  // CU-08: Seguimiento Prácticas
  {
    path: 'seguimiento',
    loadComponent: () =>
      import('./avances/avances-lista/avances-lista').then((m) => m.AvancesLista),
  },
  {
    path: 'seguimiento/nuevo',
    loadComponent: () => import('./avances/avance-nuevo/avance-nuevo').then((m) => m.AvanceNuevo),
  },
  {
    path: 'seguimiento/:id/corregir',
    loadComponent: () => import('./avances/avance-nuevo/avance-nuevo').then((m) => m.AvanceNuevo),
  },
  {
    path: 'seguimiento/:id',
    loadComponent: () =>
      import('./avances/avance-detalle/avance-detalle').then((m) => m.AvanceDetalle),
  },
];

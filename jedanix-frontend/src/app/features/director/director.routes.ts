import { Routes } from '@angular/router';

export const DIRECTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../inicio/inicio-rol').then((m) => m.InicioRol),
  },
  // CU-01: Gestionar Usuarios del Sistema
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./usuarios/usuarios-lista/usuarios-lista').then((m) => m.UsuariosLista),
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () =>
      import('./usuarios/usuario-form/usuario-form').then((m) => m.UsuarioForm),
  },
  {
    path: 'usuarios/:id/editar',
    loadComponent: () =>
      import('./usuarios/usuario-form/usuario-form').then((m) => m.UsuarioForm),
  },
  // CU-02: Gestionar Empresas Receptoras
  {
    path: 'empresas',
    loadComponent: () =>
      import('./empresas/empresas-lista/empresas-lista').then((m) => m.EmpresasListaDirector),
  },
  {
    path: 'empresas/nueva',
    loadComponent: () =>
      import('./empresas/empresa-form/empresa-form').then((m) => m.EmpresaForm),
  },
  {
    path: 'empresas/:id/editar',
    loadComponent: () =>
      import('./empresas/empresa-form/empresa-form').then((m) => m.EmpresaForm),
  },
  {
    path: 'empresas/:id',
    loadComponent: () =>
      import('./empresas/empresa-detalle/empresa-detalle').then((m) => m.EmpresaDetalleDirector),
  },
  // CU-03: Gestionar Solicitudes de Práctica
  {
    path: 'solicitudes',
    loadComponent: () =>
      import('./solicitudes/solicitudes-lista/solicitudes-lista').then((m) => m.SolicitudesLista),
  },
  {
    path: 'solicitudes/:id',
    loadComponent: () =>
      import('./solicitudes/solicitud-detalle/solicitud-detalle').then((m) => m.SolicitudDetalle),
  },
  // CU-04 / CU-05: prácticas matriculadas y cierre formal
  {
    path: 'matriculados',
    loadComponent: () =>
      import('./matriculados/matriculados-lista/matriculados-lista').then(
        (m) => m.MatriculadosLista,
      ),
  },
  {
    path: 'matriculados/:id',
    loadComponent: () =>
      import('./matriculados/cierre-practica/cierre-practica').then((m) => m.CierrePractica),
  },
];

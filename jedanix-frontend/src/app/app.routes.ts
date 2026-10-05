import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { inicioRolGuard } from './core/guards/inicio-rol.guard';
import { roleGuard } from './core/guards/role.guard';
import { RolEnum } from './core/models/usuario.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: 'estudiante',
        canActivate: [roleGuard([RolEnum.ESTUDIANTE])],
        loadChildren: () =>
          import('./features/estudiante/estudiante.routes').then((m) => m.ESTUDIANTE_ROUTES),
      },
      {
        path: 'director',
        canActivate: [roleGuard([RolEnum.DIRECTOR])],
        loadChildren: () =>
          import('./features/director/director.routes').then((m) => m.DIRECTOR_ROUTES),
      },
      {
        path: 'coordinador',
        canActivate: [roleGuard([RolEnum.COORDINADOR])],
        loadChildren: () =>
          import('./features/coordinador/coordinador.routes').then((m) => m.COORDINADOR_ROUTES),
      },
      {
        path: 'docente-asesor',
        canActivate: [roleGuard([RolEnum.DOCENTE_ASESOR])],
        loadChildren: () =>
          import('./features/docente-asesor/docente-asesor.routes').then(
            (m) => m.DOCENTE_ASESOR_ROUTES,
          ),
      },
      // Gestionar Perfil: caso de uso compartido por los 4 roles.
      {
        path: 'perfil',
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },
      // `/` no tiene pantalla propia: manda al panel del rol activo.
      { path: '', pathMatch: 'full', canActivate: [inicioRolGuard], children: [] },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

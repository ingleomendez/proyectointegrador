import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
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
      // TODO: agregar 'director' / 'coordinador' / 'docente-asesor' cuando
      // se construyan esas pantallas (ver Documentacion_Codigo_JEDANIX.md).
      { path: '', redirectTo: 'estudiante', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

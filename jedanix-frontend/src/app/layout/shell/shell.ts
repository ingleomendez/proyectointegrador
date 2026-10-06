import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { EstadoEstudianteService } from '../../core/services/estado-estudiante.service';
import { RolEnum } from '../../core/models/usuario.model';
import { menuDeRol, NOMBRE_ROL } from '../../core/utils/menu-rol';

/** Armazón visual compartido por todas las pantallas autenticadas: barra
 * lateral izquierda con el menú del rol activo (nombres tomados de los casos
 * de uso), acceso a "Mi Perfil" y cierre de sesión, más el `router-outlet`
 * donde se monta cada módulo. En pantallas angostas la barra se convierte en
 * un panel deslizable que se abre con el botón de menú.
 *
 * Para el Estudiante, el menú depende de su estado (ver
 * `EstadoEstudianteService`): se refresca en cada navegación para que "Solicitud
 * de práctica", "Objetivos" y "Seguimiento Prácticas" aparezcan o se bloqueen
 * en cuanto cambia su matrícula. */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly authService = inject(AuthService);
  private readonly estadoEstudiante = inject(EstadoEstudianteService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);

  protected readonly menu = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? menuDeRol(usuario.rol, this.estadoEstudiante.contexto()) : [];
  });

  protected readonly nombreRol = computed(() => {
    const usuario = this.authService.usuario();
    return usuario ? NOMBRE_ROL[usuario.rol] : '';
  });

  protected readonly inicial = computed(() => {
    const nombre = this.authService.usuario()?.nombreCompleto.trim() ?? '';
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  });

  constructor() {
    this.refrescarEstado();
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.refrescarEstado();
      });
  }

  private refrescarEstado(): void {
    if (this.authService.usuario()?.rol === RolEnum.ESTUDIANTE) {
      this.estadoEstudiante.refrescar();
    }
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.estadoEstudiante.limpiar();
    this.authService.logout();
  }
}

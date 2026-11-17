import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { TemaService } from '../../core/services/tema.service';
import { EstadoEstudianteService } from '../../core/services/estado-estudiante.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { AvisoSemana } from '../../shared/aviso-semana/aviso-semana';
import { Campanita } from '../../shared/campanita/campanita';
import { instalarTablasResponsivas } from '../../shared/tablas-responsivas/tablas-responsivas';
import { RolEnum } from '../../core/models/usuario.model';
import { menuDeRol, NOMBRE_ROL } from '../../core/utils/menu-rol';

const CLAVE_COLAPSO = 'jedanix-menu-colapsado';

function leerColapso(): boolean {
  try {
    return localStorage.getItem(CLAVE_COLAPSO) === '1';
  } catch {
    return false;
  }
}

/** Armazón visual compartido por todas las pantallas autenticadas: barra
 * lateral izquierda con el menú del rol activo (nombres tomados de los casos
 * de uso), acceso a "Mi Perfil" y cierre de sesión, más el `router-outlet`
 * donde se monta cada módulo. En pantallas angostas la barra se convierte en
 * un panel deslizable que se abre con el botón de menú.
 *
 * Para el Estudiante, el menú depende de su estado (ver
 * `EstadoEstudianteService`): se refresca en cada navegación para que "Solicitud
 * de práctica", "Objetivos" y "Seguimiento Prácticas" aparezcan o se bloqueen
 * en cuanto cambia su matrícula.
 *
 * En pantallas anchas la barra se puede reducir a solo íconos (botón de la
 * parte superior) y en cualquier tamaño se puede alternar el modo claro u
 * oscuro desde el pie de la barra.
 *
 * Arriba a la derecha vive la campanita de avisos; para el Estudiante, sobre el
 * contenido aparece el recordatorio de la semana por vencer. */
@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule, Campanita, AvisoSemana],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly authService = inject(AuthService);
  private readonly estadoEstudiante = inject(EstadoEstudianteService);
  private readonly router = inject(Router);
  protected readonly temaService = inject(TemaService);
  private readonly notificaciones = inject(NotificacionesService);

  protected readonly menuAbierto = signal(false);
  /** Barra lateral reducida a solo íconos (solo en pantallas anchas). Se
   * recuerda entre visitas. */
  protected readonly menuColapsado = signal(leerColapso());

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
    this.notificaciones.iniciar();
    instalarTablasResponsivas();
    inject(DestroyRef).onDestroy(() => this.notificaciones.detener());
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

  alternarColapso(): void {
    this.menuColapsado.update((colapsado) => !colapsado);
    try {
      localStorage.setItem(CLAVE_COLAPSO, this.menuColapsado() ? '1' : '0');
    } catch {
      /* sin almacenamiento: la preferencia solo dura la sesión */
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
    this.notificaciones.detener();
    this.authService.logout();
  }
}

import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { catchError, filter, of } from 'rxjs';

import { AvanceSemanalListItem } from '../../core/models/avance.model';
import { AvanceEstadoEnum, ObjetivoEstadoEnum } from '../../core/models/enums.model';
import { RolEnum } from '../../core/models/usuario.model';
import { AuthService } from '../../core/services/auth.service';
import { AvanceService } from '../../core/services/avance.service';
import { EstadoEstudianteService } from '../../core/services/estado-estudiante.service';
import { ObjetivoService } from '../../core/services/objetivo.service';
import { lunesDeSemana } from '../../core/utils/semana';

const CLAVE_DESCARTE = 'jedanix-aviso-semana';

/** Recordatorio para el Estudiante matriculado cuando la semana está por
 * vencer (de jueves a domingo): si aún no registró el avance de esta semana, o
 * el que registró fue observado y falta corregirlo. Solo aparece si ya tiene los
 * objetivos aprobados (antes no puede registrar avances) y se oculta mientras
 * está en la pantalla donde se registra o corrige el avance. Se puede cerrar y
 * no vuelve a salir ese mismo día. */
@Component({
  selector: 'jx-aviso-semana',
  imports: [RouterLink, MatIconModule],
  templateUrl: './aviso-semana.html',
  styleUrl: './aviso-semana.scss',
})
export class AvisoSemana {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly estado = inject(EstadoEstudianteService);
  private readonly avanceService = inject(AvanceService);
  private readonly objetivoService = inject(ObjetivoService);

  private readonly url = signal(this.router.url);
  private readonly objetivosAprobados = signal(false);
  private readonly avances = signal<AvanceSemanalListItem[] | null>(null);
  private readonly descartadoHoy = signal(leerDescarte() === claveDeHoy());

  protected readonly aviso = computed(() => {
    const usuario = this.auth.usuario();
    if (usuario?.rol !== RolEnum.ESTUDIANTE || !this.estado.contexto().matriculado) {
      return null;
    }
    const avances = this.avances();
    if (!this.objetivosAprobados() || avances === null || this.descartadoHoy()) {
      return null;
    }
    const url = this.url();
    if (url.includes('/seguimiento/nuevo') || url.includes('/corregir')) {
      return null;
    }

    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo
    if (dia >= 1 && dia <= 3) {
      return null; // lunes a miércoles: todavía hay tiempo de sobra
    }
    const diasRestantes = dia === 0 ? 0 : 7 - dia;

    const deEstaSemana = avances.find((a) => a.semana_calendario === lunesDeSemana(hoy));
    let titulo: string;
    let accion: { texto: string; ruta: string };
    if (!deEstaSemana) {
      titulo = 'Aún no registras el avance de esta semana.';
      accion = { texto: 'Registrar avance', ruta: '/estudiante/seguimiento/nuevo' };
    } else if (deEstaSemana.estado === AvanceEstadoEnum.OBSERVADO) {
      titulo = 'El avance de esta semana tiene observaciones por corregir.';
      accion = { texto: 'Corregir avance', ruta: `/estudiante/seguimiento/${deEstaSemana.id}/corregir` };
    } else {
      return null;
    }

    const plazo =
      diasRestantes === 0
        ? 'El plazo vence hoy a las 11:59 p. m.'
        : diasRestantes === 1
          ? 'El plazo vence mañana, domingo a las 11:59 p. m.'
          : `El plazo vence el domingo a las 11:59 p. m. (faltan ${diasRestantes} días).`;
    return { titulo, plazo, accion, urgente: diasRestantes <= 1 };
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        this.url.set(e.urlAfterRedirects);
        this.cargarAvances();
      });

    // Cuando el armazón confirma que el estudiante está matriculado, se consulta una vez.
    effect(() => {
      if (this.auth.usuario()?.rol === RolEnum.ESTUDIANTE && this.estado.contexto().matriculado) {
        untracked(() => this.cargarAvances());
      }
    });
  }

  protected descartar(): void {
    this.descartadoHoy.set(true);
    try {
      sessionStorage.setItem(CLAVE_DESCARTE, claveDeHoy());
    } catch {
      /* sin almacenamiento: solo se oculta mientras no se recargue */
    }
  }

  private cargarObjetivos(): void {
    if (this.objetivosAprobados()) {
      return; // una vez aprobados no vuelven atrás
    }
    this.objetivoService
      .obtenerMios()
      .pipe(catchError(() => of(null)))
      .subscribe((objetivos) =>
        this.objetivosAprobados.set(objetivos?.estado === ObjetivoEstadoEnum.APROBADOS),
      );
  }

  private cargarAvances(): void {
    if (this.auth.usuario()?.rol !== RolEnum.ESTUDIANTE || !this.estado.contexto().matriculado) {
      return;
    }
    this.cargarObjetivos();
    this.avanceService
      .listarMios()
      .pipe(catchError(() => of(null)))
      .subscribe((avances) => {
        if (avances) {
          this.avances.set(avances);
        }
      });
  }
}

function claveDeHoy(): string {
  return lunesDeSemana() + ':' + new Date().getDay();
}

function leerDescarte(): string | null {
  try {
    return sessionStorage.getItem(CLAVE_DESCARTE);
  } catch {
    return null;
  }
}

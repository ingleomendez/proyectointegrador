import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of } from 'rxjs';

import { AvanceSemanalListItem } from '../../../../core/models/avance.model';
import {
  AvanceEstadoEnum,
  ObjetivoEstadoEnum,
  PostulacionEstadoEnum,
} from '../../../../core/models/enums.model';
import { AvanceService } from '../../../../core/services/avance.service';
import { ObjetivoService } from '../../../../core/services/objetivo.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { etiquetaEstadoAvance, lunesDeSemana } from '../../../../core/utils/semana';

type Vista = 'cargando' | 'error' | 'sin-practica' | 'objetivos-pendientes' | 'listo';

/**
 * CU-08 (Estudiante), pasos 1-6: historial de avances + acceso a "Registrar
 * avance". El acceso se bloquea si no hay práctica MATRICULADA (2.1.b) o si
 * los objetivos no están APROBADOS (2.1.c). Si ya existe un avance de la
 * semana en curso (y no está OBSERVADO) se deshabilita el registro (5.1.a).
 */
@Component({
  selector: 'app-avances-lista',
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './avances-lista.html',
  styleUrl: './avances-lista.scss',
})
export class AvancesLista {
  private readonly postulacionService = inject(PostulacionService);
  private readonly objetivoService = inject(ObjetivoService);
  private readonly avanceService = inject(AvanceService);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  protected readonly vista = signal<Vista>('cargando');
  protected readonly avances = signal<AvanceSemanalListItem[]>([]);

  private readonly semanaActual = lunesDeSemana();

  protected readonly yaEnviadoEstaSemana = computed(() =>
    this.avances().some(
      (a) => a.semana_calendario === this.semanaActual && a.estado !== AvanceEstadoEnum.OBSERVADO,
    ),
  );

  constructor() {
    this.postulacionService.listarMias().subscribe({
      next: (postulaciones) => {
        const matriculada = postulaciones.some((p) => p.estado === PostulacionEstadoEnum.APROBADA);
        if (!matriculada) {
          this.vista.set('sin-practica');
          return;
        }
        this.cargarSiObjetivosAprobados();
      },
      error: () => this.vista.set('error'),
    });
  }

  protected totalHoras(a: AvanceSemanalListItem): number {
    return Number(a.horas_totales);
  }

  private cargarSiObjetivosAprobados(): void {
    forkJoin({
      objetivo: this.objetivoService.obtenerMios().pipe(catchError(() => of(null))),
      avances: this.avanceService.listarMios().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ objetivo, avances }) => {
        if (objetivo?.estado !== ObjetivoEstadoEnum.APROBADOS) {
          this.vista.set('objetivos-pendientes');
          return;
        }
        this.avances.set(avances);
        this.vista.set('listo');
      },
      error: () => this.vista.set('error'),
    });
  }
}

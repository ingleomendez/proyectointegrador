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
import { ObjetivoPracticaOut } from '../../../../core/models/objetivo.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { AvanceService } from '../../../../core/services/avance.service';
import { ObjetivoService } from '../../../../core/services/objetivo.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { etiquetaEstadoAvance, lunesDeSemana, semanasNoReportadas } from '../../../../core/utils/semana';

type Vista = 'cargando' | 'error' | 'sin-practica' | 'objetivos-pendientes' | 'listo';

/** Fila del historial: un avance enviado, o una semana vencida sin avance ("No reportada"). */
interface Fila {
  semana: string;
  avance: AvanceSemanalListItem | null;
}

/**
 * CU-08 (Estudiante), pasos 1-6 ("Seguimiento Prácticas"): historial de avances
 * con columnas semana, resumen, fecha y hora de envío, estado, calificación y
 * acciones ("Descargar", "Ver"; "Corregir" si está OBSERVADO) + acceso a "Registrar
 * avance".
 *
 *  - 2.1.b sin práctica matriculada: no hay acceso.
 *  - 2.1.c objetivos sin aprobar: se bloquea con un enlace a "Objetivos".
 *  - 2.1.a práctica finalizada: historial de solo lectura, sin registrar.
 *  - 5.1.a si ya existe el avance de la semana en curso (y no está OBSERVADO) se
 *    deshabilita el registro.
 *  - 5.1.b las semanas ya cerradas sin avance aparecen como "No reportada".
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
  private readonly archivoService = inject(ArchivoService);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  protected readonly vista = signal<Vista>('cargando');
  protected readonly avances = signal<AvanceSemanalListItem[]>([]);
  protected readonly noReportadas = signal<string[]>([]);
  protected readonly finalizada = signal(false);
  protected readonly descargando = signal<number | null>(null);
  protected readonly errorDescarga = signal<string | null>(null);

  private readonly semanaActual = lunesDeSemana();

  protected readonly yaEnviadoEstaSemana = computed(() =>
    this.avances().some(
      (a) => a.semana_calendario === this.semanaActual && a.estado !== AvanceEstadoEnum.OBSERVADO,
    ),
  );

  /** Avances + semanas "No reportada", de la más reciente a la más antigua. */
  protected readonly filas = computed<Fila[]>(() => {
    const filas: Fila[] = [
      ...this.avances().map((avance) => ({ semana: avance.semana_calendario, avance })),
      ...this.noReportadas().map((semana) => ({ semana, avance: null })),
    ];
    return filas.sort((a, b) => b.semana.localeCompare(a.semana));
  });

  constructor() {
    this.postulacionService.listarMias().subscribe({
      next: (postulaciones) => {
        const practica =
          postulaciones.find((p) => p.estado === PostulacionEstadoEnum.APROBADA) ??
          postulaciones.find((p) => p.estado === PostulacionEstadoEnum.FINALIZADA);
        if (!practica) {
          this.vista.set('sin-practica');
          return;
        }
        this.finalizada.set(practica.estado === PostulacionEstadoEnum.FINALIZADA);
        this.cargarHistorial(practica);
      },
      error: () => this.vista.set('error'),
    });
  }

  protected totalHoras(a: AvanceSemanalListItem): number {
    return Number(a.horas_totales);
  }

  protected resumen(a: AvanceSemanalListItem): string {
    const texto = a.actividades_a_desarrollar;
    if (!texto) {
      return '—';
    }
    return texto.length > 90 ? `${texto.slice(0, 87).trimEnd()}...` : texto;
  }

  private cargarHistorial(practica: PostulacionOut): void {
    forkJoin({
      objetivo: this.objetivoService.obtenerMios().pipe(catchError(() => of(null))),
      avances: this.avanceService.listarMios().pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ objetivo, avances }) => {
        // 2.1.c: sin objetivos aprobados no se registran avances (una práctica ya
        // finalizada sí conserva su historial aunque no se pueda registrar más).
        if (objetivo?.estado !== ObjetivoEstadoEnum.APROBADOS && !this.finalizada()) {
          this.vista.set('objetivos-pendientes');
          return;
        }
        this.avances.set(avances);
        this.noReportadas.set(this.calcularNoReportadas(objetivo, avances, practica));
        this.vista.set('listo');
      },
      error: () => this.vista.set('error'),
    });
  }

  private calcularNoReportadas(
    objetivo: ObjetivoPracticaOut | null,
    avances: AvanceSemanalListItem[],
    practica: PostulacionOut,
  ): string[] {
    return semanasNoReportadas(
      objetivo?.fecha_decision,
      avances.map((a) => a.semana_calendario),
      this.finalizada() ? practica.fecha_cierre : null,
    );
  }

  /** CU-08, flujo 6.1.b: entrega los archivos de soporte de un avance ya enviado. */
  descargar(avance: AvanceSemanalListItem): void {
    this.errorDescarga.set(null);
    this.descargando.set(avance.id);
    this.avanceService.obtener(avance.id).subscribe({
      next: (detalle) => {
        const soportes = detalle.soportes_avance;
        if (soportes.length === 0) {
          this.descargando.set(null);
          this.errorDescarga.set('Este avance no tiene soportes para descargar.');
          return;
        }
        let pendientes = soportes.length;
        soportes.forEach((soporte) => {
          const nombre = (soporte.archivo.split('/').pop() ?? 'soporte').replace(/^[0-9a-f]{32}_/, '');
          this.archivoService.descargar(soporte.archivo, nombre).subscribe({
            error: (error) => this.errorDescarga.set(mensajeDeError(error, 'No se pudo descargar un soporte.')),
            complete: () => {
              pendientes -= 1;
              if (pendientes === 0) {
                this.descargando.set(null);
              }
            },
          });
        });
      },
      error: (error) => {
        this.descargando.set(null);
        this.errorDescarga.set(mensajeDeError(error, 'No se pudieron obtener los soportes.'));
      },
    });
  }
}

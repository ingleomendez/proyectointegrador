import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { AvanceSemanalListItem, AvanceSemanalOut } from '../../../../core/models/avance.model';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';
import { AvanceEstadoEnum, ObjetivoEstadoEnum, PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { ObjetivoPracticaOut } from '../../../../core/models/objetivo.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { UsuarioOut } from '../../../../core/models/usuario.model';
import { AvanceService } from '../../../../core/services/avance.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { ObjetivoService } from '../../../../core/services/objetivo.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { etiquetaEstadoAvance, semanasNoReportadas } from '../../../../core/utils/semana';
import { detallesDeAvances } from '../../../revision/revision.util';
import { horasAceptadas, porcentajeDeHoras } from '../horas';

interface FilaHistorial {
  /** Semana calendario (lunes, `YYYY-MM-DD`). */
  semana: string;
  /** `null` cuando la semana quedó "No reportada" (CU-08, excepción 5.1.b). */
  avance: AvanceSemanalListItem | null;
  observacionDocente: string | null;
}

/**
 * CU-04 (Director), pasos 6-18: detalle de un estudiante matriculado. Datos
 * personales, empresa receptora, Coordinador y Docente Asesor asignados,
 * historial cronológico de avances (fecha, horas, calificación y observación),
 * acumulado de horas frente a las requeridas y, de forma destacada, si está en
 * el subconjunto "Pendiente de aprobación práctica" (con acceso directo al
 * cierre formal, flujo 6.1.a). Las semanas ya cerradas sin avance aparecen
 * como "No reportada" y generan una alerta de seguimiento (CU-08, notas).
 */
@Component({
  selector: 'app-matriculado-detalle',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './matriculado-detalle.html',
  styleUrl: './matriculado-detalle.scss',
})
export class MatriculadoDetalle {
  private readonly postulacionService = inject(PostulacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly avanceService = inject(AvanceService);
  private readonly objetivoService = inject(ObjetivoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);

  protected readonly PostulacionEstadoEnum = PostulacionEstadoEnum;
  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  private readonly postulacionId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly postulacion = signal<PostulacionOut | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly estudiante = signal<UsuarioOut | null>(null);
  protected readonly historial = signal<FilaHistorial[]>([]);
  /** Lunes de las semanas cerradas sin avance, de la más reciente a la más antigua. */
  protected readonly noReportadas = signal<string[]>([]);

  protected readonly aceptadas = computed(() =>
    horasAceptadas(this.historial().flatMap((f) => (f.avance ? [f.avance] : []))),
  );
  protected readonly requeridas = computed(() => this.empresa()?.horas_requeridas ?? 0);
  protected readonly porcentaje = computed(() => porcentajeDeHoras(this.aceptadas(), this.requeridas()));
  /** Pasos 16-17: llegó al 100 % y la práctica sigue sin cerrarse (el backend
   * también la saca de aquí tras un rechazo del cierre, flujo 9.1.a). */
  protected readonly pendienteCierre = computed(() => this.postulacion()?.pendiente_cierre ?? false);
  /** Cierre rechazado que aún espera un avance aceptado posterior. */
  protected readonly cierreRechazado = computed(() => {
    const p = this.postulacion();
    return (
      p?.estado === PostulacionEstadoEnum.APROBADA &&
      !!p.fecha_rechazo_cierre &&
      !p.pendiente_cierre &&
      this.porcentaje() >= 100
    );
  });

  constructor() {
    this.postulacionService
      .obtener(this.postulacionId)
      .pipe(
        switchMap((postulacion) => {
          this.postulacion.set(postulacion);
          return forkJoin({
            empresa: this.empresaService.obtener(postulacion.empresa.id),
            estudiante: this.usuarioService
              .obtener(postulacion.estudiante.id)
              .pipe(catchError(() => of(null))),
            // 404 = aún no hay objetivos: todavía no corre el seguimiento semanal.
            objetivo: this.objetivoService
              .obtenerDePostulacion(this.postulacionId)
              .pipe(catchError(() => of(null))),
            avances: this.avanceService
              .listarDePostulacion(this.postulacionId)
              .pipe(
                switchMap((lista) => {
                  const ordenados = [...lista].sort((a, b) =>
                    a.semana_calendario.localeCompare(b.semana_calendario),
                  );
                  return detallesDeAvances(this.avanceService, ordenados).pipe(
                    switchMap((detalles: AvanceSemanalOut[]) =>
                      of(
                        ordenados.map((avance) => ({
                          semana: avance.semana_calendario,
                          avance,
                          observacionDocente:
                            detalles.find((d) => d.id === avance.id)?.observacion_docente_asesor ?? null,
                        })),
                      ),
                    ),
                  );
                }),
              ),
          });
        }),
      )
      .subscribe({
        next: ({ empresa, estudiante, objetivo, avances }) => {
          this.empresa.set(empresa);
          this.estudiante.set(estudiante);
          const faltantes = this.calcularNoReportadas(objetivo, avances);
          this.noReportadas.set(faltantes);
          // Historial cronológico (más antigua primero) con las semanas vencidas intercaladas.
          const sinReporte: FilaHistorial[] = faltantes.map((semana) => ({
            semana,
            avance: null,
            observacionDocente: null,
          }));
          this.historial.set([...avances, ...sinReporte].sort((a, b) => a.semana.localeCompare(b.semana)));
          this.cargando.set(false);
        },
        error: (error) => {
          this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar el detalle del estudiante.'));
          this.cargando.set(false);
        },
      });
  }

  /** Semanas cerradas sin avance, desde que los objetivos fueron aprobados
   * (antes de eso el estudiante no puede registrar) hasta la semana anterior a
   * la actual, o hasta el cierre si la práctica ya finalizó. */
  private calcularNoReportadas(
    objetivo: ObjetivoPracticaOut | null,
    filas: FilaHistorial[],
  ): string[] {
    if (objetivo?.estado !== ObjetivoEstadoEnum.APROBADOS) {
      return [];
    }
    const finalizada = this.postulacion()?.estado === PostulacionEstadoEnum.FINALIZADA;
    return semanasNoReportadas(
      objetivo.fecha_decision,
      filas.map((f) => f.semana),
      finalizada ? this.postulacion()?.fecha_cierre : null,
    );
  }
}

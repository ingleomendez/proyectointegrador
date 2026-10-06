import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of, switchMap } from 'rxjs';

import { AvanceSemanalListItem, AvanceSemanalOut } from '../../../../core/models/avance.model';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';
import { AvanceEstadoEnum, PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { AvanceService } from '../../../../core/services/avance.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../../core/utils/errores';
import { etiquetaEstadoAvance } from '../../../../core/utils/semana';
import { detallesDeAvances } from '../../../revision/revision.util';

type Decision = 'finalizar' | 'rechazar' | null;

/**
 * CU-05 (Director): cierre formal de una práctica ("Aprobar cierre" /
 * "Rechazar cierre"). Muestra las horas aceptadas frente a las requeridas y los
 * avances con la calificación del Coordinador y la observación del Docente. El backend solo
 * permite finalizar cuando las horas aceptadas alcanzan las requeridas
 * (excepción 5.1.a); rechazar el cierre exige una observación (9.1.a.1).
 */
@Component({
  selector: 'app-cierre-practica',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cierre-practica.html',
  styleUrl: './cierre-practica.scss',
})
export class CierrePractica {
  private readonly postulacionService = inject(PostulacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly avanceService = inject(AvanceService);
  private readonly route = inject(ActivatedRoute);

  protected readonly PostulacionEstadoEnum = PostulacionEstadoEnum;
  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  protected readonly postulacionId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly postulacion = signal<PostulacionOut | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly avances = signal<AvanceSemanalListItem[]>([]);
  /** Observación del Docente Asesor por avance (CU-05, paso 7). */
  protected readonly observaciones = signal<Map<number, string>>(new Map());
  protected readonly decision = signal<Decision>(null);
  protected readonly procesando = signal(false);
  protected readonly errorDecision = signal<string | null>(null);

  protected readonly observacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly horasAceptadas = computed(() =>
    this.avances()
      .filter((a) => a.estado === AvanceEstadoEnum.ACEPTADO)
      .reduce((total, a) => total + Number(a.horas_totales), 0),
  );

  protected readonly horasRequeridas = computed(() => this.empresa()?.horas_requeridas ?? 0);

  protected readonly cumpleHoras = computed(
    () => this.horasRequeridas() > 0 && this.horasAceptadas() >= this.horasRequeridas(),
  );

  /** CU-05, precondición 2: en el subconjunto "Pendiente de aprobación práctica"
   * (tras un rechazo del cierre exige un avance aceptado posterior, flujo 9.1.a). */
  protected readonly puedeAprobar = computed(() => this.postulacion()?.pendiente_cierre ?? false);

  protected readonly porcentaje = computed(() => {
    const requeridas = this.horasRequeridas();
    return requeridas > 0 ? Math.min(100, Math.round((this.horasAceptadas() / requeridas) * 100)) : 0;
  });

  protected readonly resumen = computed(() => {
    const lista = this.avances();
    return {
      total: lista.length,
      aceptados: lista.filter((a) => a.estado === AvanceEstadoEnum.ACEPTADO).length,
      pendientes: lista.filter((a) => a.estado === AvanceEstadoEnum.PENDIENTE_DE_REVISION).length,
      observados: lista.filter((a) => a.estado === AvanceEstadoEnum.OBSERVADO).length,
    };
  });

  constructor() {
    this.postulacionService.obtener(this.postulacionId).subscribe({
      next: (postulacion) => {
        this.postulacion.set(postulacion);
        forkJoin({
          empresa: this.empresaService.obtener(postulacion.empresa.id),
          avances: this.avanceService.listarDePostulacion(this.postulacionId).pipe(
            switchMap((lista) => {
              const ordenados = [...lista].sort((a, b) =>
                a.semana_calendario.localeCompare(b.semana_calendario),
              );
              return detallesDeAvances(this.avanceService, ordenados).pipe(
                switchMap((detalles: AvanceSemanalOut[]) => of({ ordenados, detalles })),
              );
            }),
          ),
        }).subscribe({
          next: ({ empresa, avances }) => {
            this.empresa.set(empresa);
            this.avances.set(avances.ordenados);
            this.observaciones.set(
              new Map(
                avances.detalles
                  .filter((d) => d.observacion_docente_asesor)
                  .map((d) => [d.id, d.observacion_docente_asesor as string]),
              ),
            );
            this.cargando.set(false);
          },
          error: (error) => {
            this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar el detalle de la práctica.'));
            this.cargando.set(false);
          },
        });
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la práctica.'));
        this.cargando.set(false);
      },
    });
  }

  protected elegir(decision: Decision): void {
    this.errorDecision.set(null);
    this.observacion.reset('');
    this.decision.set(decision);
  }

  protected confirmar(): void {
    const decision = this.decision();
    if (!decision) {
      return;
    }
    if (decision === 'rechazar' && this.observacion.invalid) {
      this.observacion.markAsTouched(); // 9.1.a.1
      return;
    }
    this.procesando.set(true);
    this.postulacionService
      .decidirCierre(this.postulacionId, {
        aprobar: decision === 'finalizar',
        observacion_cierre: decision === 'rechazar' ? this.observacion.value.trim() : null,
      })
      .subscribe({
        next: (actualizada) => {
          this.postulacion.set(actualizada);
          this.decision.set(null);
          this.procesando.set(false);
        },
        error: (error) => {
          this.procesando.set(false);
          this.errorDecision.set(mensajeDeError(error, 'No se pudo registrar el cierre.'));
        },
      });
  }
}

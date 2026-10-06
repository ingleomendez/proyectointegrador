import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, forkJoin, of } from 'rxjs';

import { AvanceSemanalListItem } from '../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../core/models/enums.model';
import { ObjetivoPracticaOut } from '../../../core/models/objetivo.model';
import { PostulacionListItem } from '../../../core/models/postulacion.model';
import { RolEnum } from '../../../core/models/usuario.model';
import { AuthService } from '../../../core/services/auth.service';
import { AvanceService } from '../../../core/services/avance.service';
import { ObjetivoService } from '../../../core/services/objetivo.service';
import { PostulacionService } from '../../../core/services/postulacion.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { rutaInicioDeRol } from '../../../core/utils/menu-rol';
import { etiquetaEstadoAvance } from '../../../core/utils/semana';

interface FilaAvance {
  avance: AvanceSemanalListItem;
  /** Solo Docente Asesor: ya tiene observación registrada. */
  observado: boolean;
}

/**
 * Estudiante seleccionado (CU-09, pasos 4-6; CU-10, pasos 4-6; CU-11, pasos
 * 14-15): historial de avances con fecha, estado y calificación (Coordinador)
 * u observación (Docente). El Docente Asesor además ve aquí los objetivos
 * pendientes de aprobación, con "Aprobar" y "Rechazar" (observación
 * obligatoria, excepción 17.1.a.1).
 */
@Component({
  selector: 'app-estudiante-detalle',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './estudiante-detalle.html',
})
export class EstudianteDetalle {
  private readonly postulacionService = inject(PostulacionService);
  private readonly avanceService = inject(AvanceService);
  private readonly objetivoService = inject(ObjetivoService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  private readonly rol = this.authService.usuario()?.rol ?? RolEnum.COORDINADOR;
  protected readonly esCoordinador = this.rol === RolEnum.COORDINADOR;
  protected readonly rutaBase = rutaInicioDeRol(this.rol);
  private readonly postulacionId = Number(this.route.snapshot.paramMap.get('postulacionId'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly postulacion = signal<PostulacionListItem | null>(null);
  protected readonly filas = signal<FilaAvance[]>([]);
  protected readonly objetivos = signal<ObjetivoPracticaOut[]>([]);

  protected readonly pendientes = computed(() =>
    this.filas().filter((f) =>
      this.esCoordinador
        ? f.avance.estado === AvanceEstadoEnum.PENDIENTE_DE_REVISION
        : !f.observado,
    ).length,
  );

  // ---- Decisión sobre objetivos (Docente, CU-11) ----
  protected readonly decision = signal<{ objetivoId: number; tipo: 'aprobar' | 'rechazar' } | null>(null);
  protected readonly procesando = signal(false);
  protected readonly errorDecision = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly observacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    forkJoin({
      estudiantes: this.postulacionService.listarMatriculados(),
      avances: this.esCoordinador
        ? this.avanceService.listarCoordinador()
        : this.avanceService.listarDocente(),
      objetivos: this.esCoordinador
        ? of<ObjetivoPracticaOut[]>([])
        : this.objetivoService.listarPendientes(),
    }).subscribe({
      next: ({ estudiantes, avances, objetivos }) => {
        const encontrada = estudiantes.find((p) => p.id === this.postulacionId) ?? null;
        if (!encontrada) {
          this.errorCarga.set('No se encontró el estudiante entre tus asignados.');
          this.cargando.set(false);
          return;
        }
        this.postulacion.set(encontrada);
        this.objetivos.set(objetivos.filter((o) => o.postulacion_id === this.postulacionId));

        const suyos = avances
          .filter((a) => a.postulacion_id === this.postulacionId)
          .sort((a, b) => b.semana_calendario.localeCompare(a.semana_calendario));
        this.armarFilas(suyos).subscribe({
          next: (filas) => {
            this.filas.set(filas);
            this.cargando.set(false);
          },
          error: (error) => {
            this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los avances.'));
            this.cargando.set(false);
          },
        });
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar el estudiante.'));
        this.cargando.set(false);
      },
    });
  }

  /** El listado trae `tiene_observacion_docente`, así que no hace falta pedir el detalle de cada avance. */
  private armarFilas(avances: AvanceSemanalListItem[]): Observable<FilaAvance[]> {
    return of(
      avances.map((avance) => ({
        avance,
        observado: !this.esCoordinador && !!avance.tiene_observacion_docente,
      })),
    );
  }

  protected textoAccion(fila: FilaAvance): string {
    if (this.esCoordinador) {
      return fila.avance.estado === AvanceEstadoEnum.PENDIENTE_DE_REVISION
        ? 'Revisar'
        : fila.avance.estado === AvanceEstadoEnum.ACEPTADO
          ? 'Ver / modificar calificación'
          : 'Ver';
    }
    return fila.observado ? 'Ver / editar observación' : 'Observar';
  }

  // ---- CU-11 (Docente): decidir objetivos ----

  protected elegir(objetivoId: number, tipo: 'aprobar' | 'rechazar'): void {
    this.errorDecision.set(null);
    this.mensajeExito.set(null);
    this.observacion.reset('');
    this.decision.set({ objetivoId, tipo });
  }

  protected cancelar(): void {
    this.decision.set(null);
  }

  protected confirmar(objetivo: ObjetivoPracticaOut): void {
    const actual = this.decision();
    if (!actual || actual.objetivoId !== objetivo.id) {
      return;
    }
    if (actual.tipo === 'rechazar' && this.observacion.invalid) {
      this.observacion.markAsTouched(); // 17.1.a.1
      return;
    }
    this.procesando.set(true);
    this.objetivoService
      .decidir(objetivo.id, {
        aprobar: actual.tipo === 'aprobar',
        observacion_docente: actual.tipo === 'rechazar' ? this.observacion.value.trim() : null,
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);
          this.decision.set(null);
          this.objetivos.update((lista) => lista.filter((o) => o.id !== objetivo.id));
          this.mensajeExito.set(
            actual.tipo === 'aprobar'
              ? 'Objetivos aprobados. El estudiante ya puede registrar avances.'
              : 'Objetivos rechazados. El estudiante podrá corregirlos y reenviarlos.',
          );
        },
        error: (error) => {
          this.procesando.set(false);
          this.errorDecision.set(mensajeDeError(error, 'No se pudo registrar la decisión.'));
        },
      });
  }
}

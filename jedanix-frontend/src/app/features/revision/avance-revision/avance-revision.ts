import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AvanceSemanalOut } from '../../../core/models/avance.model';
import { AvanceEstadoEnum } from '../../../core/models/enums.model';
import { RolEnum } from '../../../core/models/usuario.model';
import { ArchivoService } from '../../../core/services/archivo.service';
import { AuthService } from '../../../core/services/auth.service';
import { AvanceService } from '../../../core/services/avance.service';
import { mensajeDeError } from '../../../core/utils/errores';
import { rutaInicioDeRol } from '../../../core/utils/menu-rol';
import { etiquetaEstadoAvance } from '../../../core/utils/semana';

type Modo = 'calificar' | 'observar';

/**
 * Detalle de un avance para quien lo revisa. Comparte los mismos campos para
 * Coordinador y Docente Asesor (CU-10, paso 8). El Coordinador califica
 * (0.0 a 5.0, el avance pasa a ACEPTADO) u observa (pasa a OBSERVADO y el
 * estudiante puede corregirlo) -- CU-09, pasos 12-16. El Docente Asesor deja
 * una observación cualitativa que nunca cambia el estado -- CU-10, pasos
 * 10-13 -- y puede editarla después (flujo alterno 7.1.a).
 */
@Component({
  selector: 'app-avance-revision',
  imports: [
    DatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './avance-revision.html',
  styleUrl: './avance-revision.scss',
})
export class AvanceRevision {
  private readonly avanceService = inject(AvanceService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  protected readonly archivoService = inject(ArchivoService);

  protected readonly AvanceEstadoEnum = AvanceEstadoEnum;
  protected readonly etiqueta = etiquetaEstadoAvance;

  private readonly rol = this.authService.usuario()?.rol ?? RolEnum.COORDINADOR;
  protected readonly esCoordinador = this.rol === RolEnum.COORDINADOR;
  protected readonly rutaBase = rutaInicioDeRol(this.rol);
  private readonly avanceId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly avance = signal<AvanceSemanalOut | null>(null);
  protected readonly modo = signal<Modo>('calificar');
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly exito = signal<string | null>(null);

  protected readonly calificacion = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0), Validators.max(5)],
  });
  protected readonly comentario = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly observacionDocente = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    this.avanceService.obtener(this.avanceId).subscribe({
      next: (datos) => {
        this.mostrar(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar el avance.'));
        this.cargando.set(false);
      },
    });
  }

  protected cambiarModo(modo: Modo): void {
    this.modo.set(modo);
    this.errorGuardado.set(null);
    this.exito.set(null);
  }

  /** CU-09, pasos 12-16. */
  protected guardarCoordinador(): void {
    this.errorGuardado.set(null);
    this.exito.set(null);
    const calificando = this.modo() === 'calificar';
    const control = calificando ? this.calificacion : this.comentario;
    if (control.invalid) {
      control.markAsTouched(); // 12.1.a: la calificación o el comentario son obligatorios
      return;
    }
    this.guardando.set(true);
    this.avanceService
      .calificar(
        this.avanceId,
        calificando
          ? { calificacion_coordinador: Number(this.calificacion.value) }
          : { comentario_coordinador: this.comentario.value.trim() },
      )
      .subscribe({
        next: (datos) => {
          this.mostrar(datos);
          this.guardando.set(false);
          this.exito.set(
            calificando
              ? 'Avance calificado y aceptado. Se notificó al estudiante.'
              : 'Avance observado. El estudiante podrá corregirlo y reenviarlo.',
          );
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorGuardado.set(mensajeDeError(error, 'No se pudo registrar la revisión.'));
        },
      });
  }

  /** CU-10, pasos 10-13 y flujo alterno 7.1.a. */
  protected guardarDocente(): void {
    this.errorGuardado.set(null);
    this.exito.set(null);
    if (this.observacionDocente.invalid) {
      this.observacionDocente.markAsTouched();
      return;
    }
    this.guardando.set(true);
    this.avanceService
      .observar(this.avanceId, { observacion_docente_asesor: this.observacionDocente.value.trim() })
      .subscribe({
        next: (datos) => {
          this.mostrar(datos);
          this.guardando.set(false);
          this.exito.set('Observación registrada. Se notificó al estudiante.');
        },
        error: (error) => {
          this.guardando.set(false);
          this.errorGuardado.set(mensajeDeError(error, 'No se pudo registrar la observación.'));
        },
      });
  }

  protected nombreArchivo(ruta: string): string {
    const nombre = ruta.split('/').pop() ?? ruta;
    return nombre.replace(/^[0-9a-f]{32}_/, '');
  }

  private mostrar(datos: AvanceSemanalOut): void {
    this.avance.set(datos);
    this.observacionDocente.setValue(datos.observacion_docente_asesor ?? '');
    this.calificacion.setValue(
      datos.calificacion_coordinador !== null ? Number(datos.calificacion_coordinador) : null,
    );
    this.comentario.setValue('');
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ObjetivoEstadoEnum } from '../../../core/models/enums.model';
import { ObjetivoPracticaOut } from '../../../core/models/objetivo.model';
import { ObjetivoService } from '../../../core/services/objetivo.service';

/**
 * CU-11 (Estudiante): plantear los objetivos de la práctica, ver su estado
 * mientras el Docente Asesor los revisa, y corregir/reenviar si fueron
 * RECHAZADOS. Pantalla única (no lista + detalle) porque a lo sumo existe
 * un planteamiento de objetivos vigente por práctica (ver
 * `objetivo_practica.py`, constraint `UNIQUE(postulacion_id)`).
 */
@Component({
  selector: 'app-objetivos',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './objetivos.html',
  styleUrl: './objetivos.scss',
})
export class Objetivos {
  private readonly objetivoService = inject(ObjetivoService);

  protected readonly ObjetivoEstadoEnum = ObjetivoEstadoEnum;

  protected readonly cargando = signal(true);
  protected readonly sinPractica = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly objetivo = signal<ObjetivoPracticaOut | null>(null);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  protected readonly contenido = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    this.objetivoService.obtenerMios().subscribe({
      next: (datos) => {
        this.objetivo.set(datos);
        if (datos.estado === ObjetivoEstadoEnum.RECHAZADOS) {
          this.contenido.setValue(datos.contenido);
        } else {
          // PENDIENTE_DE_APROBACION o APROBADOS: solo lectura (pasos 9 y 3.1.a).
          this.contenido.setValue(datos.contenido);
          this.contenido.disable();
        }
        this.cargando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          const detalle: string = error.error?.detail ?? '';
          if (detalle.toUpperCase().includes('MATRICULADO')) {
            // Excepción 1.1.a: sin práctica MATRICULADA.
            this.sinPractica.set(true);
          }
          // Si no, es "aún no se han planteado objetivos": se deja el
          // formulario vacío y habilitado para el envío inicial (paso 4).
        } else {
          this.errorCarga.set('No se pudieron cargar tus objetivos. Intenta de nuevo.');
        }
        this.cargando.set(false);
      },
    });
  }

  protected get puedeEditar(): boolean {
    const actual = this.objetivo();
    return actual === null || actual.estado === ObjetivoEstadoEnum.RECHAZADOS;
  }

  enviar(): void {
    if (this.contenido.invalid) {
      this.contenido.markAsTouched();
      return;
    }
    this.errorEnvio.set(null);
    this.enviando.set(true);
    this.objetivoService.enviar({ contenido: this.contenido.value }).subscribe({
      next: (datos) => {
        this.objetivo.set(datos);
        this.contenido.disable();
        this.enviando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.errorEnvio.set(
          error.error?.detail ?? 'No se pudieron enviar los objetivos. Intenta de nuevo.',
        );
        this.enviando.set(false);
      },
    });
  }
}

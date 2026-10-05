import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ObjetivoPracticaOut } from '../../../core/models/objetivo.model';
import { ObjetivoService } from '../../../core/services/objetivo.service';
import { mensajeDeError } from '../../../core/utils/errores';

interface DecisionActiva {
  objetivoId: number;
  tipo: 'aprobar' | 'rechazar';
}

/**
 * CU-11 (Docente Asesor), pasos 11-18: bandeja de objetivos de práctica
 * pendientes de decisión de los estudiantes asignados. Aprobar los habilita
 * para registrar avances; rechazar exige una observación (excepción 17.1.a.1)
 * y el estudiante los corrige y reenvía.
 */
@Component({
  selector: 'app-objetivos-pendientes',
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
  templateUrl: './objetivos-pendientes.html',
})
export class ObjetivosPendientes {
  private readonly objetivoService = inject(ObjetivoService);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly objetivos = signal<ObjetivoPracticaOut[]>([]);
  protected readonly activa = signal<DecisionActiva | null>(null);
  protected readonly procesando = signal(false);
  protected readonly errorDecision = signal<string | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);

  protected readonly observacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  constructor() {
    this.objetivoService.listarPendientes().subscribe({
      next: (datos) => {
        this.objetivos.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los objetivos pendientes.'));
        this.cargando.set(false);
      },
    });
  }

  protected elegir(objetivoId: number, tipo: 'aprobar' | 'rechazar'): void {
    this.errorDecision.set(null);
    this.mensajeExito.set(null);
    this.observacion.reset('');
    this.activa.set({ objetivoId, tipo });
  }

  protected cancelar(): void {
    this.activa.set(null);
  }

  protected confirmar(objetivo: ObjetivoPracticaOut): void {
    const decision = this.activa();
    if (!decision || decision.objetivoId !== objetivo.id) {
      return;
    }
    if (decision.tipo === 'rechazar' && this.observacion.invalid) {
      this.observacion.markAsTouched(); // 17.1.a.1
      return;
    }
    this.procesando.set(true);
    this.objetivoService
      .decidir(objetivo.id, {
        aprobar: decision.tipo === 'aprobar',
        observacion_docente: decision.tipo === 'rechazar' ? this.observacion.value.trim() : null,
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);
          this.activa.set(null);
          this.objetivos.update((lista) => lista.filter((o) => o.id !== objetivo.id));
          this.mensajeExito.set(
            decision.tipo === 'aprobar'
              ? `Objetivos de ${objetivo.estudiante_nombre} aprobados.`
              : `Objetivos de ${objetivo.estudiante_nombre} rechazados; el estudiante podrá corregirlos.`,
          );
        },
        error: (error) => {
          this.procesando.set(false);
          this.errorDecision.set(mensajeDeError(error, 'No se pudo registrar la decisión.'));
        },
      });
  }
}

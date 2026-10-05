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
import { catchError, forkJoin, of } from 'rxjs';

import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';
import { PostulacionEstadoEnum } from '../../../../core/models/enums.model';
import { PostulacionOut } from '../../../../core/models/postulacion.model';
import { UsuarioOut } from '../../../../core/models/usuario.model';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { mensajeDeError } from '../../../../core/utils/errores';

type Decision = 'aprobar' | 'rechazar' | null;

/**
 * CU-03 (Director), pasos 6-18: revisar una postulación (datos del estudiante,
 * documentos cargados y respuestas de la bitácora) y aprobarla o rechazarla.
 * El rechazo exige un motivo (excepción 13.1.a.1). Si el estudiante ya quedó
 * matriculado en otra empresa, el backend responde 409 (excepción 14.1.a) y
 * se muestra su mensaje.
 */
@Component({
  selector: 'app-solicitud-detalle',
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
  templateUrl: './solicitud-detalle.html',
})
export class SolicitudDetalle {
  private readonly postulacionService = inject(PostulacionService);
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  protected readonly archivoService = inject(ArchivoService);

  protected readonly PostulacionEstadoEnum = PostulacionEstadoEnum;
  private readonly postulacionId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly postulacion = signal<PostulacionOut | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  /** Datos completos del estudiante (programa académico, paso 8); opcional si no se pudo consultar. */
  protected readonly estudiante = signal<UsuarioOut | null>(null);
  protected readonly decision = signal<Decision>(null);
  protected readonly procesando = signal(false);
  protected readonly errorDecision = signal<string | null>(null);

  protected readonly motivo = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  /** Preguntas de la bitácora con la respuesta del estudiante (si la dio). */
  protected readonly respuestas = computed(() => {
    const p = this.postulacion();
    const e = this.empresa();
    if (!p || !e) {
      return [];
    }
    return e.preguntas_bitacora.map((pregunta) => ({
      enunciado: pregunta.enunciado,
      respuesta: p.respuestas_bitacora.find((r) => r.pregunta_id === pregunta.id)?.respuesta_texto ?? null,
    }));
  });

  /** Documentos requeridos con el archivo que subió el estudiante (si lo hizo). */
  protected readonly documentos = computed(() => {
    const p = this.postulacion();
    const e = this.empresa();
    if (!p || !e) {
      return [];
    }
    return e.documentos_requeridos.map((doc) => ({
      nombre: doc.nombre_documento,
      archivo: p.documentos_postulacion.find((d) => d.documento_requerido_id === doc.id)?.archivo ?? null,
    }));
  });

  constructor() {
    this.postulacionService.obtener(this.postulacionId).subscribe({
      next: (postulacion) => {
        this.postulacion.set(postulacion);
        forkJoin({
          empresa: this.empresaService.obtener(postulacion.empresa.id),
          estudiante: this.usuarioService
            .obtener(postulacion.estudiante.id)
            .pipe(catchError(() => of(null))),
        }).subscribe({
          next: ({ empresa, estudiante }) => {
            this.empresa.set(empresa);
            this.estudiante.set(estudiante);
            this.cargando.set(false);
          },
          error: (error) => {
            this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la empresa de la solicitud.'));
            this.cargando.set(false);
          },
        });
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la solicitud.'));
        this.cargando.set(false);
      },
    });
  }

  protected elegir(decision: Decision): void {
    this.errorDecision.set(null);
    this.motivo.reset('');
    this.decision.set(decision);
  }

  protected confirmar(): void {
    const decision = this.decision();
    if (!decision) {
      return;
    }
    if (decision === 'rechazar' && this.motivo.invalid) {
      this.motivo.markAsTouched(); // 15.1.a: el motivo no puede estar vacío
      return;
    }
    this.procesando.set(true);
    this.postulacionService
      .decidir(this.postulacionId, {
        aprobar: decision === 'aprobar',
        motivo_rechazo: decision === 'rechazar' ? this.motivo.value.trim() : null,
      })
      .subscribe({
        next: (actualizada) => {
          this.postulacion.set(actualizada);
          this.decision.set(null);
          this.procesando.set(false);
        },
        error: (error) => {
          this.procesando.set(false);
          this.errorDecision.set(mensajeDeError(error, 'No se pudo registrar la decisión.'));
        },
      });
  }

  protected nombreArchivo(ruta: string): string {
    const nombre = ruta.split('/').pop() ?? ruta;
    return nombre.replace(/^[0-9a-f]{32}_/, '');
  }
}

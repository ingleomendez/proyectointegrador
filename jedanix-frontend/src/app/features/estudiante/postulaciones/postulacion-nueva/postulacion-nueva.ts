import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { EmpresaService } from '../../../../core/services/empresa.service';
import { PostulacionService } from '../../../../core/services/postulacion.service';
import { ArchivoService } from '../../../../core/services/archivo.service';
import { EmpresaReceptoraOut } from '../../../../core/models/empresa.model';

interface EstadoCargaDocumento {
  subiendo: boolean;
  nombreArchivo?: string;
  error?: string;
}

/** CU-06, pasos 11-24: formulario de postulación a una empresa receptora.
 * Cada documento requerido se carga de verdad como PDF (paso 13: "el sistema
 * valida que el archivo tenga formato PDF") a través de `ArchivoService`, que
 * devuelve la ruta que se guarda en el campo `archivo` del formulario antes
 * de enviar. Permite "Guardar como borrador" (enviar=false) o "Enviar
 * solicitud formalmente" (enviar=true) con el mismo POST /postulaciones. */
@Component({
  selector: 'app-postulacion-nueva',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './postulacion-nueva.html',
  styleUrl: './postulacion-nueva.scss',
})
export class PostulacionNueva {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly postulacionService = inject(PostulacionService);
  private readonly archivoService = inject(ArchivoService);

  protected readonly empresaId = Number(this.route.snapshot.paramMap.get('empresaId'));

  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly cargando = signal(true);
  protected readonly enviando = signal(false);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly errorEnvio = signal<string | null>(null);

  private readonly estadosDocumentos = signal<Record<number, EstadoCargaDocumento>>({});

  protected readonly formulario: FormGroup = this.fb.group({
    respuestas: this.fb.array([]),
    documentos: this.fb.array([]),
  });

  constructor() {
    this.empresaService.obtener(this.empresaId).subscribe({
      next: (datos) => {
        this.empresa.set(datos);
        this.construirFormulario(datos);
        this.cargando.set(false);
      },
      error: () => {
        this.errorCarga.set('No se pudo cargar la información de la empresa.');
        this.cargando.set(false);
      },
    });
  }

  protected get respuestas(): FormArray {
    return this.formulario.get('respuestas') as FormArray;
  }

  protected get documentos(): FormArray {
    return this.formulario.get('documentos') as FormArray;
  }

  private construirFormulario(empresa: EmpresaReceptoraOut): void {
    empresa.preguntas_bitacora.forEach((pregunta) => {
      this.respuestas.push(
        this.fb.group({
          pregunta_id: [pregunta.id],
          enunciado: [pregunta.enunciado],
          respuesta_texto: ['', Validators.required],
        }),
      );
    });
    empresa.documentos_requeridos.forEach((documento) => {
      this.documentos.push(
        this.fb.group({
          documento_requerido_id: [documento.id],
          nombre_documento: [documento.nombre_documento],
          archivo: ['', Validators.required],
        }),
      );
    });
  }

  protected estaSubiendo(indice: number): boolean {
    return this.estadosDocumentos()[indice]?.subiendo ?? false;
  }

  protected nombreArchivoCargado(indice: number): string | undefined {
    return this.estadosDocumentos()[indice]?.nombreArchivo;
  }

  protected errorArchivo(indice: number): string | undefined {
    return this.estadosDocumentos()[indice]?.error;
  }

  onArchivoSeleccionado(indice: number, archivos: FileList | null): void {
    const archivo = archivos?.[0];
    if (!archivo) {
      return;
    }

    const esPdf = archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      this.actualizarEstadoDocumento(indice, {
        subiendo: false,
        error: 'Solo se aceptan archivos en formato PDF.',
      });
      return;
    }

    this.actualizarEstadoDocumento(indice, { subiendo: true, error: undefined });

    this.archivoService.subir(archivo).subscribe({
      next: ({ archivo: rutaArchivo }) => {
        this.documentos.at(indice).get('archivo')?.setValue(rutaArchivo);
        this.actualizarEstadoDocumento(indice, { subiendo: false, nombreArchivo: archivo.name });
      },
      error: (error: HttpErrorResponse) => {
        this.actualizarEstadoDocumento(indice, {
          subiendo: false,
          error: error.error?.detail ?? 'No se pudo cargar el archivo. Intenta de nuevo.',
        });
      },
    });
  }

  private actualizarEstadoDocumento(indice: number, cambios: Partial<EstadoCargaDocumento>): void {
    this.estadosDocumentos.update((estados) => {
      const actual: EstadoCargaDocumento = estados[indice] ?? { subiendo: false };
      return {
        ...estados,
        [indice]: { ...actual, ...cambios },
      };
    });
  }

  guardarBorrador(): void {
    this.enviar(false);
  }

  enviarSolicitud(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviar(true);
  }

  private enviar(enviar: boolean): void {
    this.enviando.set(true);
    this.errorEnvio.set(null);

    const valores = this.formulario.getRawValue();
    this.postulacionService
      .crear({
        empresa_id: this.empresaId,
        enviar,
        respuestas_bitacora: valores.respuestas.map((r: { pregunta_id: number; respuesta_texto: string }) => ({
          pregunta_id: r.pregunta_id,
          respuesta_texto: r.respuesta_texto,
        })),
        documentos_postulacion: valores.documentos.map(
          (d: { documento_requerido_id: number; archivo: string }) => ({
            documento_requerido_id: d.documento_requerido_id,
            archivo: d.archivo,
          }),
        ),
      })
      .subscribe({
        next: (postulacion) => {
          this.router.navigate(['/estudiante/postulaciones', postulacion.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.enviando.set(false);
          this.errorEnvio.set(
            error.error?.detail ?? 'No se pudo registrar la postulación. Intenta de nuevo.',
          );
        },
      });
  }
}

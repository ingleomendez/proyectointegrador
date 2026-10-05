import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { EmpresaReceptoraOut, PreguntaBitacoraCreate } from '../../../../core/models/empresa.model';
import { EmpresaEstadoEnum, TipoRespuestaEnum } from '../../../../core/models/enums.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { leerConfirmacion, mensajeDeError } from '../../../../core/utils/errores';
import { ETIQUETA_TIPO_RESPUESTA } from '../empresa-form/empresa-form';

/**
 * CU-02 (Director): detalle de una empresa receptora. Desde aquí se agregan
 * preguntas de bitácora (con aviso si el enunciado ya existe, excepción
 * 17.1.a), documentos requeridos, y se inactiva la empresa (con aviso si hay
 * postulaciones pendientes, excepción 31.1.a).
 */
@Component({
  selector: 'app-empresa-detalle-director',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './empresa-detalle.html',
})
export class EmpresaDetalleDirector {
  private readonly empresaService = inject(EmpresaService);
  private readonly route = inject(ActivatedRoute);

  protected readonly EmpresaEstadoEnum = EmpresaEstadoEnum;
  protected readonly tiposRespuesta = Object.values(TipoRespuestaEnum);
  protected readonly etiquetaTipo = ETIQUETA_TIPO_RESPUESTA;

  private readonly empresaId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly procesando = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  // Inactivar
  protected readonly confirmarInactivar = signal<{ mensaje: string; forzar: boolean } | null>(null);

  // Preguntas
  protected readonly confirmarDuplicada = signal<{ mensaje: string; datos: PreguntaBitacoraCreate } | null>(null);
  protected readonly formPregunta = new FormGroup({
    enunciado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo_respuesta: new FormControl<TipoRespuestaEnum>(TipoRespuestaEnum.TEXTO_LIBRE, { nonNullable: true }),
  });

  // Documentos
  protected readonly formDocumento = new FormGroup({
    nombre_documento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.cargar();
  }

  // ---- Preguntas (pasos 16-19) ----

  protected agregarPregunta(confirmarDuplicado = false, datosConfirmados?: PreguntaBitacoraCreate): void {
    this.errorAccion.set(null);
    if (!datosConfirmados && this.formPregunta.invalid) {
      this.formPregunta.markAllAsTouched();
      return;
    }
    const v = this.formPregunta.getRawValue();
    const datos: PreguntaBitacoraCreate = datosConfirmados ?? {
      enunciado: v.enunciado.trim(),
      tipo_respuesta: v.tipo_respuesta,
    };

    this.procesando.set(true);
    this.empresaService.agregarPregunta(this.empresaId, datos, confirmarDuplicado).subscribe({
      next: () => {
        this.procesando.set(false);
        this.confirmarDuplicada.set(null);
        this.formPregunta.reset({ enunciado: '', tipo_respuesta: TipoRespuestaEnum.TEXTO_LIBRE });
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(false);
        const requiere = leerConfirmacion(error);
        if (requiere) {
          this.confirmarDuplicada.set({ mensaje: requiere.mensaje, datos }); // 17.1.a
          return;
        }
        this.errorAccion.set(mensajeDeError(error, 'No se pudo agregar la pregunta.'));
      },
    });
  }

  // ---- Documentos requeridos (pasos 22-24) ----

  protected agregarDocumento(): void {
    this.errorAccion.set(null);
    if (this.formDocumento.invalid) {
      this.formDocumento.markAllAsTouched();
      return;
    }
    this.procesando.set(true);
    this.empresaService
      .agregarDocumentoRequerido(this.empresaId, {
        nombre_documento: this.formDocumento.getRawValue().nombre_documento.trim(),
      })
      .subscribe({
        next: () => {
          this.procesando.set(false);
          this.formDocumento.reset({ nombre_documento: '' });
          this.cargar();
        },
        error: (error) => {
          this.procesando.set(false);
          this.errorAccion.set(mensajeDeError(error, 'No se pudo agregar el documento.'));
        },
      });
  }

  // ---- Inactivar ----

  protected pedirInactivar(): void {
    this.errorAccion.set(null);
    this.confirmarInactivar.set({
      mensaje: '¿Seguro que deseas inactivar esta empresa? Dejará de estar disponible para nuevas postulaciones.',
      forzar: false,
    });
  }

  protected inactivar(): void {
    const actual = this.confirmarInactivar();
    if (!actual) {
      return;
    }
    this.procesando.set(true);
    this.empresaService.inactivar(this.empresaId, actual.forzar).subscribe({
      next: (empresa) => {
        this.procesando.set(false);
        this.confirmarInactivar.set(null);
        this.empresa.set(empresa);
      },
      error: (error) => {
        this.procesando.set(false);
        const requiere = leerConfirmacion(error);
        if (requiere) {
          this.confirmarInactivar.set({ mensaje: requiere.mensaje, forzar: true }); // 31.1.a
          return;
        }
        this.confirmarInactivar.set(null);
        this.errorAccion.set(mensajeDeError(error, 'No se pudo inactivar la empresa.'));
      },
    });
  }

  private cargar(): void {
    this.empresaService.obtener(this.empresaId).subscribe({
      next: (datos) => {
        this.empresa.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la empresa.'));
        this.cargando.set(false);
      },
    });
  }
}

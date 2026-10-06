import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';

import { EmpresaReceptoraOut, PreguntaBitacoraCreate } from '../../../../core/models/empresa.model';
import { EmpresaEstadoEnum, TipoRespuestaEnum } from '../../../../core/models/enums.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { leerConfirmacion, mensajeDeError } from '../../../../core/utils/errores';

/**
 * CU-02 (Director): detalle de una empresa receptora. Desde aquí se agregan,
 * editan y eliminan preguntas de bitácora (con aviso si el enunciado ya
 * existe, excepción 17.1.a) y documentos requeridos (con confirmación si hay
 * postulaciones en curso que ya los usan, excepción 22.1.a), y se inactiva la
 * empresa (con aviso si hay postulaciones pendientes, excepción 31.1.a).
 */

type TipoItem = 'pregunta' | 'documento';
@Component({
  selector: 'app-empresa-detalle-director',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './empresa-detalle.html',
  styleUrl: './empresa-detalle.scss',
})
export class EmpresaDetalleDirector {
  private readonly empresaService = inject(EmpresaService);
  private readonly route = inject(ActivatedRoute);

  protected readonly EmpresaEstadoEnum = EmpresaEstadoEnum;

  private readonly empresaId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly empresa = signal<EmpresaReceptoraOut | null>(null);
  protected readonly procesando = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  // Edición en línea de una pregunta o documento existente (flujo alterno 4.1.a)
  protected readonly edicion = signal<{ tipo: TipoItem; id: number } | null>(null);
  protected readonly controlEdicion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly confirmarDuplicadaEdicion = signal<{ id: number; mensaje: string; enunciado: string } | null>(null);

  // Eliminación con confirmación (excepción 22.1.a)
  protected readonly confirmarEliminar = signal<{
    tipo: TipoItem;
    id: number;
    nombre: string;
    mensaje: string;
    forzado: boolean;
  } | null>(null);

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

  // ---- Editar preguntas y documentos existentes (flujo alterno 4.1.a) ----

  protected iniciarEdicion(tipo: TipoItem, id: number, textoActual: string): void {
    this.errorAccion.set(null);
    this.confirmarEliminar.set(null);
    this.confirmarDuplicadaEdicion.set(null);
    this.controlEdicion.setValue(textoActual);
    this.controlEdicion.markAsUntouched();
    this.edicion.set({ tipo, id });
  }

  protected cancelarEdicion(): void {
    this.edicion.set(null);
    this.confirmarDuplicadaEdicion.set(null);
  }

  protected guardarEdicion(confirmarDuplicado = false): void {
    const actual = this.edicion();
    if (!actual) {
      return;
    }
    if (this.controlEdicion.invalid || !this.controlEdicion.value.trim()) {
      this.controlEdicion.markAsTouched();
      return;
    }
    const texto = this.controlEdicion.value.trim();
    this.errorAccion.set(null);
    this.procesando.set(true);

    const peticion: Observable<unknown> =
      actual.tipo === 'pregunta'
        ? this.empresaService.actualizarPregunta(this.empresaId, actual.id, { enunciado: texto }, confirmarDuplicado)
        : this.empresaService.actualizarDocumentoRequerido(this.empresaId, actual.id, { nombre_documento: texto });

    peticion.subscribe({
      next: () => {
        this.procesando.set(false);
        this.cancelarEdicion();
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(false);
        const requiere = leerConfirmacion(error);
        if (requiere && actual.tipo === 'pregunta') {
          this.confirmarDuplicadaEdicion.set({ id: actual.id, mensaje: requiere.mensaje, enunciado: texto }); // 17.1.a
          return;
        }
        this.errorAccion.set(mensajeDeError(error, 'No se pudo guardar el cambio.'));
      },
    });
  }

  // ---- Eliminar preguntas y documentos (flujo alterno 4.1.a, excepción 22.1.a) ----

  protected pedirEliminar(tipo: TipoItem, id: number, nombre: string): void {
    this.errorAccion.set(null);
    this.cancelarEdicion();
    this.confirmarEliminar.set({
      tipo,
      id,
      nombre,
      mensaje:
        tipo === 'pregunta'
          ? `¿Eliminar la pregunta «${nombre}»? Dejará de pedirse en nuevas postulaciones.`
          : `¿Eliminar el documento «${nombre}»? Dejará de pedirse en nuevas postulaciones.`,
      forzado: false,
    });
  }

  protected eliminar(): void {
    const actual = this.confirmarEliminar();
    if (!actual) {
      return;
    }
    this.procesando.set(true);
    const peticion: Observable<unknown> =
      actual.tipo === 'pregunta'
        ? this.empresaService.eliminarPregunta(this.empresaId, actual.id, actual.forzado)
        : this.empresaService.eliminarDocumentoRequerido(this.empresaId, actual.id, actual.forzado);

    peticion.subscribe({
      next: () => {
        this.procesando.set(false);
        this.confirmarEliminar.set(null);
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(false);
        const requiere = leerConfirmacion(error);
        if (requiere) {
          this.confirmarEliminar.set({ ...actual, mensaje: requiere.mensaje, forzado: true }); // 22.1.a
          return;
        }
        this.confirmarEliminar.set(null);
        this.errorAccion.set(mensajeDeError(error, 'No se pudo eliminar.'));
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

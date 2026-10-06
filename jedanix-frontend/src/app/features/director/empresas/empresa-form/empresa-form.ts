import { Component, inject, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin, of } from 'rxjs';

import { TipoRespuestaEnum } from '../../../../core/models/enums.model';
import { RolEnum, UsuarioEstadoEnum, UsuarioListItem } from '../../../../core/models/usuario.model';
import { EmpresaService } from '../../../../core/services/empresa.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { mensajeDeError } from '../../../../core/utils/errores';

/**
 * CU-02 (Director): crear una empresa receptora con sus responsables, al
 * menos una pregunta de bitácora y los documentos requeridos (pasos 6-29), o
 * editar sus datos generales y responsables. Las preguntas y documentos de
 * una empresa existente se agregan, editan o eliminan desde su pantalla de detalle.
 */
@Component({
  selector: 'app-empresa-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './empresa-form.html',
})
export class EmpresaForm {
  private readonly empresaService = inject(EmpresaService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);


  private readonly empresaId: number | null = this.route.snapshot.paramMap.has('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly esEdicion = this.empresaId !== null;

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly coordinadores = signal<UsuarioListItem[]>([]);
  protected readonly docentes = signal<UsuarioListItem[]>([]);

  protected readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    requisitos_generales: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    horas_requeridas: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    telefono: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(30)] }),
    direccion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    coordinador_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    docente_asesor_id: new FormControl<number | null>(null, { validators: [Validators.required] }),
    preguntas_bitacora: new FormArray<FormGroup<{ enunciado: FormControl<string>; tipo_respuesta: FormControl<TipoRespuestaEnum> }>>([]),
    documentos_requeridos: new FormArray<FormControl<string>>([]),
  });

  constructor() {
    if (this.esEdicion) {
      this.form.controls.preguntas_bitacora.disable();
      this.form.controls.documentos_requeridos.disable();
    } else {
      this.agregarPregunta(); // paso 29: se exige al menos una pregunta
    }

    forkJoin({
      coordinadores: this.usuarioService.listar(RolEnum.COORDINADOR),
      docentes: this.usuarioService.listar(RolEnum.DOCENTE_ASESOR),
      empresa: this.empresaId !== null ? this.empresaService.obtener(this.empresaId) : of(null),
    }).subscribe({
      next: ({ coordinadores, docentes, empresa }) => {
        const activos = (lista: UsuarioListItem[]) => lista.filter((u) => u.estado === UsuarioEstadoEnum.ACTIVO);
        this.coordinadores.set(activos(coordinadores));
        this.docentes.set(activos(docentes));
        if (empresa) {
          this.form.patchValue({
            nombre: empresa.nombre,
            descripcion: empresa.descripcion,
            requisitos_generales: empresa.requisitos_generales,
            horas_requeridas: empresa.horas_requeridas,
            telefono: empresa.telefono ?? '',
            direccion: empresa.direccion ?? '',
            coordinador_id: empresa.coordinador.id,
            docente_asesor_id: empresa.docente_asesor.id,
          });
          // Si el responsable actual quedó inactivo, sigue apareciendo en el selector.
          if (!this.coordinadores().some((u) => u.id === empresa.coordinador.id)) {
            this.coordinadores.update((l) => [...l, empresa.coordinador]);
          }
          if (!this.docentes().some((u) => u.id === empresa.docente_asesor.id)) {
            this.docentes.update((l) => [...l, empresa.docente_asesor]);
          }
        }
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar la información necesaria.'));
        this.cargando.set(false);
      },
    });
  }

  protected get preguntas() {
    return this.form.controls.preguntas_bitacora;
  }

  protected get documentos() {
    return this.form.controls.documentos_requeridos;
  }

  protected agregarPregunta(): void {
    this.preguntas.push(
      new FormGroup({
        enunciado: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        tipo_respuesta: new FormControl<TipoRespuestaEnum>(TipoRespuestaEnum.TEXTO_LIBRE, { nonNullable: true }),
      }),
    );
  }

  protected quitarPregunta(indice: number): void {
    if (this.preguntas.length > 1) {
      this.preguntas.removeAt(indice);
    }
  }

  protected agregarDocumento(): void {
    this.documentos.push(new FormControl('', { nonNullable: true, validators: [Validators.required] }));
  }

  protected quitarDocumento(indice: number): void {
    this.documentos.removeAt(indice);
  }

  protected guardar(): void {
    this.errorGuardado.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const base = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim(),
      requisitos_generales: v.requisitos_generales.trim(),
      horas_requeridas: Number(v.horas_requeridas),
      telefono: v.telefono.trim(),
      direccion: v.direccion.trim(),
      coordinador_id: Number(v.coordinador_id),
      docente_asesor_id: Number(v.docente_asesor_id),
    };

    this.guardando.set(true);
    const peticion =
      this.empresaId === null
        ? this.empresaService.crear({
            ...base,
            preguntas_bitacora: v.preguntas_bitacora.map((p) => ({
              enunciado: p.enunciado.trim(),
              tipo_respuesta: p.tipo_respuesta,
            })),
            documentos_requeridos: v.documentos_requeridos.map((nombre) => ({
              nombre_documento: nombre.trim(),
            })),
          })
        : this.empresaService.actualizar(this.empresaId, base);

    peticion.subscribe({
      next: (empresa) => this.router.navigate(['/director/empresas', empresa.id]),
      error: (error) => {
        this.guardando.set(false);
        this.errorGuardado.set(mensajeDeError(error, 'No se pudo guardar la empresa.'));
      },
    });
  }
}

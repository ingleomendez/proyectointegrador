import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { RolEnum } from '../../../../core/models/usuario.model';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { leerConfirmacion, mensajeDeError } from '../../../../core/utils/errores';
import { NOMBRE_ROL } from '../../../../core/utils/menu-rol';

const FORMATO_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * CU-01 (Director): crear una cuenta (pasos 6-21) o editarla (flujo alterno
 * 4.1.a). El correo no es editable al editar. El programa académico es
 * obligatorio solo si el rol es ESTUDIANTE (paso 16) y no aplica a los demás.
 * Si cambiar el rol deja empresas sin responsable, el backend responde 409
 * con `requiere_confirmacion` (excepción 6.1.a) y se pide confirmar.
 */
@Component({
  selector: 'app-usuario-form',
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
  templateUrl: './usuario-form.html',
})
export class UsuarioForm {
  private readonly usuarioService = inject(UsuarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly RolEnum = RolEnum;
  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly roles = Object.values(RolEnum);

  private readonly usuarioId: number | null = this.route.snapshot.paramMap.has('id')
    ? Number(this.route.snapshot.paramMap.get('id'))
    : null;
  protected readonly esEdicion = this.usuarioId !== null;

  protected readonly cargando = signal(this.esEdicion);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly confirmacion = signal<string | null>(null);
  protected readonly creado = signal<string | null>(null);
  private readonly rolSeleccionado = signal<RolEnum | null>(null);
  protected readonly esEstudiante = computed(() => this.rolSeleccionado() === RolEnum.ESTUDIANTE);

  protected readonly form = new FormGroup({
    nombre_completo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    correo_institucional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(FORMATO_CORREO)],
    }),
    rol: new FormControl<RolEnum | null>(null, { validators: [Validators.required] }),
    programa_academico: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.form.controls.rol.valueChanges.subscribe((rol) => {
      this.rolSeleccionado.set(rol);
      this.ajustarPrograma();
    });

    if (this.usuarioId !== null) {
      this.form.controls.correo_institucional.disable(); // el correo no es editable (4.1.a)
      this.usuarioService.obtener(this.usuarioId).subscribe({
        next: (u) => {
          this.form.patchValue({
            nombre_completo: u.nombre_completo,
            correo_institucional: u.correo_institucional,
            rol: u.rol,
            programa_academico: u.programa_academico ?? '',
          });
          this.ajustarPrograma();
          this.cargando.set(false);
        },
        error: (error) => {
          this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar el usuario.'));
          this.cargando.set(false);
        },
      });
    }
  }

  protected guardar(confirmarCambioRol = false): void {
    this.errorGuardado.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // 10.1.a
      return;
    }
    const valores = this.form.getRawValue();
    const rol = valores.rol as RolEnum;
    const programa = rol === RolEnum.ESTUDIANTE ? valores.programa_academico.trim() : null;

    this.guardando.set(true);
    if (this.usuarioId === null) {
      this.usuarioService
        .crear({
          nombre_completo: valores.nombre_completo.trim(),
          correo_institucional: valores.correo_institucional.trim(),
          rol,
          programa_academico: programa,
        })
        .subscribe({
          next: (u) => {
            this.guardando.set(false);
            this.creado.set(u.correo_institucional);
          },
          error: (error) => {
            this.guardando.set(false);
            this.errorGuardado.set(mensajeDeError(error, 'No se pudo crear el usuario.'));
          },
        });
      return;
    }

    this.usuarioService
      .actualizar(
        this.usuarioId,
        { nombre_completo: valores.nombre_completo.trim(), rol, programa_academico: programa },
        confirmarCambioRol,
      )
      .subscribe({
        next: () => this.router.navigateByUrl('/director/usuarios'),
        error: (error) => {
          this.guardando.set(false);
          const requiere = leerConfirmacion(error);
          if (requiere) {
            this.confirmacion.set(requiere.mensaje); // 6.1.a
            return;
          }
          this.errorGuardado.set(mensajeDeError(error, 'No se pudo actualizar el usuario.'));
        },
      });
  }

  protected confirmarYGuardar(): void {
    this.confirmacion.set(null);
    this.guardar(true);
  }

  protected crearOtro(): void {
    this.creado.set(null);
    this.form.reset({ nombre_completo: '', correo_institucional: '', rol: null, programa_academico: '' });
  }

  private ajustarPrograma(): void {
    const control = this.form.controls.programa_academico;
    if (this.form.controls.rol.value === RolEnum.ESTUDIANTE) {
      control.setValidators([Validators.required]); // paso 16
    } else {
      control.clearValidators();
      control.setValue('');
    }
    control.updateValueAndValidity();
  }
}

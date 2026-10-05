import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { FactorRhEnum, GrupoSanguineoEnum } from '../../core/models/enums.model';
import { RolEnum, UsuarioOut } from '../../core/models/usuario.model';
import { ArchivoService } from '../../core/services/archivo.service';
import { AuthService } from '../../core/services/auth.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { mensajeDeError } from '../../core/utils/errores';
import { NOMBRE_ROL } from '../../core/utils/menu-rol';

const TAMANO_MAXIMO_FOTO = 2 * 1024 * 1024; // 2 MB (Gestionar Perfil, excepción 9.1.c)
const TIPOS_FOTO = ['image/jpeg', 'image/png'];
const FORMATO_CELULAR = /^\+?\d{7,15}$/; // misma regla que `PerfilUpdate` en el backend

/**
 * Gestionar Perfil (caso de uso compartido por los 4 roles): ver y editar los
 * datos personales y la imagen de perfil. El correo, el rol y el programa
 * académico son de solo lectura (los define el Director en CU-01). Los campos
 * de dirección / grupo sanguíneo / RH / EPS solo existen para el Estudiante,
 * y la EPS es obligatoria para él (excepción 22.1.a).
 */
@Component({
  selector: 'app-perfil',
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
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly usuarioService = inject(UsuarioService);
  private readonly archivoService = inject(ArchivoService);
  private readonly authService = inject(AuthService);

  protected readonly gruposSanguineos = Object.values(GrupoSanguineoEnum);
  protected readonly factoresRh = Object.values(FactorRhEnum);
  protected readonly nombreRol = NOMBRE_ROL;

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly perfil = signal<UsuarioOut | null>(null);
  protected readonly guardando = signal(false);
  protected readonly subiendoFoto = signal(false);
  protected readonly errorFoto = signal<string | null>(null);
  protected readonly errorGuardado = signal<string | null>(null);
  protected readonly exito = signal(false);
  protected readonly fotoPerfil = signal<string | null>(null);

  protected readonly esEstudiante = computed(() => this.perfil()?.rol === RolEnum.ESTUDIANTE);

  protected readonly fotoUrl = computed(() => {
    const ruta = this.fotoPerfil();
    if (!ruta) {
      return null;
    }
    return ruta.startsWith('/') ? this.archivoService.urlPublica(ruta) : ruta;
  });

  protected readonly form = new FormGroup({
    nombre_completo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    celular: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(FORMATO_CELULAR)],
    }),
    direccion_residencia: new FormControl('', { nonNullable: true }),
    grupo_sanguineo: new FormControl<GrupoSanguineoEnum | null>(null),
    factor_rh: new FormControl<FactorRhEnum | null>(null),
    eps: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.usuarioService.obtenerMiPerfil().subscribe({
      next: (datos) => {
        this.cargarFormulario(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudo cargar tu perfil. Intenta de nuevo.'));
        this.cargando.set(false);
      },
    });
  }

  protected cancelar(): void {
    const datos = this.perfil();
    if (datos) {
      this.cargarFormulario(datos); // 5.1.a: se descartan los cambios
    }
  }

  protected seleccionarFoto(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) {
      return;
    }
    this.errorFoto.set(null);
    if (!TIPOS_FOTO.includes(archivo.type)) {
      this.errorFoto.set('Formato no permitido. Usa una imagen JPG o PNG.'); // 9.1.b
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      this.errorFoto.set('La imagen supera el tamaño máximo permitido (2 MB).'); // 9.1.c
      return;
    }
    this.subiendoFoto.set(true);
    this.archivoService.subir(archivo, true).subscribe({
      next: (resultado) => {
        this.fotoPerfil.set(resultado.archivo); // vista previa; se guarda con "Guardar cambios"
        this.subiendoFoto.set(false);
      },
      error: (error) => {
        this.errorFoto.set(mensajeDeError(error, 'No se pudo cargar la imagen. Intenta de nuevo.'));
        this.subiendoFoto.set(false);
      },
    });
  }

  protected quitarFoto(): void {
    this.fotoPerfil.set(null);
  }

  protected guardar(): void {
    this.exito.set(false);
    this.errorGuardado.set(null);

    const valores = this.form.getRawValue();
    if (this.esEstudiante() && !valores.eps.trim()) {
      this.form.controls.eps.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // 12.1.a
      return;
    }

    const estudiante = this.esEstudiante();
    this.guardando.set(true);
    this.usuarioService
      .actualizarMiPerfil({
        nombre_completo: valores.nombre_completo.trim(),
        celular: valores.celular.trim() || null,
        foto_perfil: this.fotoPerfil(),
        direccion_residencia: estudiante ? valores.direccion_residencia.trim() || null : null,
        grupo_sanguineo: estudiante ? valores.grupo_sanguineo : null,
        factor_rh: estudiante ? valores.factor_rh : null,
        eps: estudiante ? valores.eps.trim() : null,
      })
      .subscribe({
        next: (datos) => {
          this.cargarFormulario(datos);
          this.authService.actualizarNombre(datos.nombre_completo);
          this.guardando.set(false);
          this.exito.set(true); // 16
        },
        error: (error) => {
          this.errorGuardado.set(
            mensajeDeError(error, 'No se pudieron guardar los cambios. Se conservan tus datos anteriores.'),
          );
          this.guardando.set(false);
        },
      });
  }

  private cargarFormulario(datos: UsuarioOut): void {
    this.perfil.set(datos);
    this.fotoPerfil.set(datos.foto_perfil);
    this.form.reset({
      nombre_completo: datos.nombre_completo,
      celular: datos.celular ?? '',
      direccion_residencia: datos.direccion_residencia ?? '',
      grupo_sanguineo: datos.grupo_sanguineo,
      factor_rh: datos.factor_rh,
      eps: datos.eps ?? '',
    });
  }
}

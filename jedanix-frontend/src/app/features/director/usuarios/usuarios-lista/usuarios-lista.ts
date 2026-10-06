import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  RolEnum,
  UsuarioEstadoEnum,
  UsuarioListItem,
} from '../../../../core/models/usuario.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { leerConfirmacion, mensajeDeError } from '../../../../core/utils/errores';
import { NOMBRE_ROL } from '../../../../core/utils/menu-rol';

interface ConfirmacionInactivar {
  usuario: UsuarioListItem;
  mensaje: string;
  forzar: boolean;
}

/**
 * CU-01 (Director), pasos 1-3 y flujos alternos 4.1.b / 4.1.c: listado de
 * usuarios con filtro por rol, acceso a crear/editar, e inactivar/reactivar.
 * Inactivar pide confirmación y, si el usuario tiene avances sin revisar
 * (excepción 4.1.b.1), una segunda confirmación con el aviso del backend.
 * "Reenviar credenciales" (excepción 19.1.a) genera una contraseña temporal nueva
 * y la envía al correo del usuario.
 */
@Component({
  selector: 'app-usuarios-lista',
  imports: [
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './usuarios-lista.html',
})
export class UsuariosLista {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);

  protected readonly RolEnum = RolEnum;
  protected readonly UsuarioEstadoEnum = UsuarioEstadoEnum;
  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly roles = Object.values(RolEnum);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly usuarios = signal<UsuarioListItem[]>([]);
  protected readonly filtroRol = signal<RolEnum | ''>('');
  protected readonly confirmacion = signal<ConfirmacionInactivar | null>(null);
  protected readonly confirmacionReenvio = signal<UsuarioListItem | null>(null);
  protected readonly mensajeExito = signal<string | null>(null);
  protected readonly procesando = signal(false);
  protected readonly errorAccion = signal<string | null>(null);

  protected readonly visibles = computed(() => {
    const rol = this.filtroRol();
    return rol ? this.usuarios().filter((u) => u.rol === rol) : this.usuarios();
  });

  protected readonly miId = computed(() => this.authService.usuario()?.usuarioId ?? null);

  constructor() {
    this.cargar();
  }

  protected cambiarFiltro(rol: RolEnum | ''): void {
    this.filtroRol.set(rol);
  }

  protected pedirInactivar(usuario: UsuarioListItem): void {
    this.errorAccion.set(null);
    this.mensajeExito.set(null);
    this.confirmacionReenvio.set(null);
    this.confirmacion.set({
      usuario,
      mensaje: `¿Seguro que deseas inactivar a ${usuario.nombre_completo}? No podrá iniciar sesión.`,
      forzar: false,
    });
  }

  protected cancelar(): void {
    this.confirmacion.set(null);
  }

  // ---- Reenviar credenciales (CU-01, excepción 19.1.a) ----

  protected pedirReenvio(usuario: UsuarioListItem): void {
    this.errorAccion.set(null);
    this.mensajeExito.set(null);
    this.confirmacion.set(null);
    this.confirmacionReenvio.set(usuario);
  }

  protected confirmarReenvio(): void {
    const usuario = this.confirmacionReenvio();
    if (!usuario) {
      return;
    }
    this.procesando.set(true);
    this.usuarioService.reenviarCredenciales(usuario.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.confirmacionReenvio.set(null);
        this.mensajeExito.set(
          `Se generó una contraseña temporal nueva y se envió a ${usuario.correo_institucional}.`,
        );
      },
      error: (error) => {
        this.procesando.set(false);
        this.confirmacionReenvio.set(null);
        this.errorAccion.set(mensajeDeError(error, 'No se pudieron reenviar las credenciales.'));
      },
    });
  }

  protected confirmarInactivar(): void {
    const actual = this.confirmacion();
    if (!actual) {
      return;
    }
    this.procesando.set(true);
    this.usuarioService.inactivar(actual.usuario.id, actual.forzar).subscribe({
      next: () => {
        this.procesando.set(false);
        this.confirmacion.set(null);
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(false);
        const requiere = leerConfirmacion(error);
        if (requiere) {
          // Excepción 4.1.b.1: segunda confirmación con el aviso del backend.
          this.confirmacion.set({ usuario: actual.usuario, mensaje: requiere.mensaje, forzar: true });
          return;
        }
        this.confirmacion.set(null);
        this.errorAccion.set(mensajeDeError(error, 'No se pudo inactivar al usuario.'));
      },
    });
  }

  protected reactivar(usuario: UsuarioListItem): void {
    this.errorAccion.set(null);
    this.procesando.set(true);
    this.usuarioService.reactivar(usuario.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.cargar();
      },
      error: (error) => {
        this.procesando.set(false);
        this.errorAccion.set(mensajeDeError(error, 'No se pudo reactivar al usuario.'));
      },
    });
  }

  private cargar(): void {
    this.usuarioService.listar().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.errorCarga.set(mensajeDeError(error, 'No se pudieron cargar los usuarios.'));
        this.cargando.set(false);
      },
    });
  }
}

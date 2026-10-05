import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest, TokenResponse } from '../models/auth.model';
import { RolEnum } from '../models/usuario.model';

const CLAVE_TOKEN = 'jedanix_token';
const CLAVE_USUARIO = 'jedanix_usuario';

/** Datos mínimos de la sesión activa, extraídos del `TokenResponse` del login
 * y persistidos en `localStorage` para sobrevivir a un refresh de página. */
export interface SesionUsuario {
  usuarioId: number;
  nombreCompleto: string;
  rol: RolEnum;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly usuarioSignal = signal<SesionUsuario | null>(this.leerSesionGuardada());

  /** Sesión activa (o `null` si no hay nadie autenticado). Se expone como
   * señal de solo lectura para que los componentes reaccionen a login/logout
   * sin tener que suscribirse manualmente a nada. */
  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);

  login(credenciales: LoginRequest): Observable<TokenResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/login`, credenciales)
      .pipe(tap((respuesta) => this.guardarSesion(respuesta)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioSignal.set(null);
    this.router.navigateByUrl('/login');
  }

  /** Usado por `authInterceptor` para adjuntar el header `Authorization`. */
  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  private guardarSesion(respuesta: TokenResponse): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.access_token);
    const sesion: SesionUsuario = {
      usuarioId: respuesta.usuario_id,
      nombreCompleto: respuesta.nombre_completo,
      rol: respuesta.rol,
    };
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(sesion));
    this.usuarioSignal.set(sesion);
  }

  private leerSesionGuardada(): SesionUsuario | null {
    const token = localStorage.getItem(CLAVE_TOKEN);
    const datos = localStorage.getItem(CLAVE_USUARIO);
    if (!token || !datos) {
      return null;
    }
    try {
      return JSON.parse(datos) as SesionUsuario;
    } catch {
      return null;
    }
  }
}

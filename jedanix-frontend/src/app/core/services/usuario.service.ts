import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PerfilUpdate,
  RolEnum,
  UsuarioCreate,
  UsuarioListItem,
  UsuarioOut,
  UsuarioUpdateDirector,
} from '../models/usuario.model';

/** Gestionar Perfil (todos los roles) y CU-01 Gestionar Usuarios (Director). */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  // ---- Gestionar Perfil ----

  obtenerMiPerfil(): Observable<UsuarioOut> {
    return this.http.get<UsuarioOut>(`${this.baseUrl}/me`);
  }

  actualizarMiPerfil(data: PerfilUpdate): Observable<UsuarioOut> {
    return this.http.put<UsuarioOut>(`${this.baseUrl}/me`, data);
  }

  // ---- CU-01 (Director) ----

  listar(rol?: RolEnum): Observable<UsuarioListItem[]> {
    let params = new HttpParams();
    if (rol) {
      params = params.set('rol', rol);
    }
    return this.http.get<UsuarioListItem[]>(this.baseUrl, { params });
  }

  /** CU-01, paso 11: opciones del selector "Programa académico". */
  programasAcademicos(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/programas-academicos`);
  }

  obtener(id: number): Observable<UsuarioOut> {
    return this.http.get<UsuarioOut>(`${this.baseUrl}/${id}`);
  }

  crear(data: UsuarioCreate): Observable<UsuarioOut> {
    return this.http.post<UsuarioOut>(this.baseUrl, data);
  }

  actualizar(id: number, data: UsuarioUpdateDirector, confirmarCambioRol = false): Observable<UsuarioOut> {
    let params = new HttpParams();
    if (confirmarCambioRol) {
      params = params.set('confirmar_cambio_rol', 'true');
    }
    return this.http.put<UsuarioOut>(`${this.baseUrl}/${id}`, data, { params });
  }

  inactivar(id: number, forzar = false): Observable<UsuarioOut> {
    let params = new HttpParams();
    if (forzar) {
      params = params.set('forzar', 'true');
    }
    return this.http.patch<UsuarioOut>(`${this.baseUrl}/${id}/inactivar`, {}, { params });
  }

  /** CU-01, excepción 19.1.a: genera una contraseña temporal nueva y la envía por correo. */
  reenviarCredenciales(id: number): Observable<UsuarioOut> {
    return this.http.post<UsuarioOut>(`${this.baseUrl}/${id}/reenviar-credenciales`, {});
  }

  reactivar(id: number): Observable<UsuarioOut> {
    return this.http.patch<UsuarioOut>(`${this.baseUrl}/${id}/reactivar`, {});
  }
}

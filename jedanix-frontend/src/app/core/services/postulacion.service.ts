import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PostulacionCierre,
  PostulacionCreate,
  PostulacionDecision,
  PostulacionListItem,
  PostulacionOut,
  PostulacionUpdate,
} from '../models/postulacion.model';

/** CU-06: postulación del Estudiante a una empresa receptora. */
@Injectable({ providedIn: 'root' })
export class PostulacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/postulaciones`;

  crear(data: PostulacionCreate): Observable<PostulacionOut> {
    return this.http.post<PostulacionOut>(this.baseUrl, data);
  }

  /** Flujo alterno 9.1.a: reemplaza documentos y respuestas de un BORRADOR propio
   * ("Guardar y salir") o lo envía formalmente con `enviar: true`. */
  actualizarBorrador(postulacionId: number, data: PostulacionUpdate): Observable<PostulacionOut> {
    return this.http.put<PostulacionOut>(`${this.baseUrl}/${postulacionId}`, data);
  }

  /** Flujo alterno 9.1.a: promueve un BORRADOR propio a PENDIENTE_DE_APROBACION. */
  enviarBorrador(postulacionId: number): Observable<PostulacionOut> {
    return this.http.post<PostulacionOut>(`${this.baseUrl}/${postulacionId}/enviar`, {});
  }

  listarMias(): Observable<PostulacionOut[]> {
    return this.http.get<PostulacionOut[]>(`${this.baseUrl}/me`);
  }

  obtener(postulacionId: number): Observable<PostulacionOut> {
    return this.http.get<PostulacionOut>(`${this.baseUrl}/${postulacionId}`);
  }

  // ---- CU-03 / CU-04 / CU-05 (Director) ----

  /** CU-03: solicitudes PENDIENTE_DE_APROBACION (todas, o de una empresa). */
  listarPendientes(empresaId?: number): Observable<PostulacionListItem[]> {
    let params = new HttpParams();
    if (empresaId !== undefined) {
      params = params.set('empresa_id', empresaId);
    }
    return this.http.get<PostulacionListItem[]>(`${this.baseUrl}/pendientes`, { params });
  }

  decidir(postulacionId: number, data: PostulacionDecision): Observable<PostulacionOut> {
    return this.http.patch<PostulacionOut>(`${this.baseUrl}/${postulacionId}/decision`, data);
  }

  /** CU-05: cierre formal de la práctica (o rechazo del cierre con observación). */
  decidirCierre(postulacionId: number, data: PostulacionCierre): Observable<PostulacionOut> {
    return this.http.patch<PostulacionOut>(`${this.baseUrl}/${postulacionId}/cierre`, data);
  }

  /** Prácticas matriculadas: todas para el Director; solo las de sus empresas
   * para Coordinador y Docente Asesor (lo decide el rol del token). */
  listarMatriculados(): Observable<PostulacionListItem[]> {
    return this.http.get<PostulacionListItem[]>(`${this.baseUrl}/matriculados`);
  }
}

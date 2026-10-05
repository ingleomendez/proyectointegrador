import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PostulacionCreate, PostulacionOut } from '../models/postulacion.model';

/** CU-06: postulación del Estudiante a una empresa receptora. */
@Injectable({ providedIn: 'root' })
export class PostulacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/postulaciones`;

  crear(data: PostulacionCreate): Observable<PostulacionOut> {
    return this.http.post<PostulacionOut>(this.baseUrl, data);
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
}

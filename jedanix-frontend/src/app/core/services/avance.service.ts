import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AvanceCalificacion,
  AvanceObservacionDocente,
  AvanceSemanalCreate,
  AvanceSemanalListItem,
  AvanceSemanalOut,
} from '../models/avance.model';

/** CU-08 (lado Estudiante): registrar y consultar avances semanales.
 * Calificar (CU-09) y observar (CU-10) se agregan con las pantallas de
 * Coordinador y Docente Asesor. */
@Injectable({ providedIn: 'root' })
export class AvanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/avances`;

  registrar(data: AvanceSemanalCreate): Observable<AvanceSemanalOut> {
    return this.http.post<AvanceSemanalOut>(this.baseUrl, data);
  }

  listarMios(): Observable<AvanceSemanalListItem[]> {
    return this.http.get<AvanceSemanalListItem[]>(`${this.baseUrl}/me`);
  }

  obtener(id: number): Observable<AvanceSemanalOut> {
    return this.http.get<AvanceSemanalOut>(`${this.baseUrl}/${id}`);
  }

  // ---- CU-09 (Coordinador) ----

  listarCoordinador(soloPendientes = false): Observable<AvanceSemanalListItem[]> {
    let params = new HttpParams();
    if (soloPendientes) {
      params = params.set('solo_pendientes', 'true');
    }
    return this.http.get<AvanceSemanalListItem[]>(`${this.baseUrl}/coordinador`, { params });
  }

  calificar(id: number, data: AvanceCalificacion): Observable<AvanceSemanalOut> {
    return this.http.patch<AvanceSemanalOut>(`${this.baseUrl}/${id}/calificacion`, data);
  }

  // ---- CU-10 (Docente Asesor) ----

  listarDocente(): Observable<AvanceSemanalListItem[]> {
    return this.http.get<AvanceSemanalListItem[]>(`${this.baseUrl}/docente`);
  }

  observar(id: number, data: AvanceObservacionDocente): Observable<AvanceSemanalOut> {
    return this.http.patch<AvanceSemanalOut>(`${this.baseUrl}/${id}/observacion`, data);
  }

  // ---- CU-05 (Director) ----

  listarDePostulacion(postulacionId: number): Observable<AvanceSemanalListItem[]> {
    return this.http.get<AvanceSemanalListItem[]>(`${this.baseUrl}/postulacion/${postulacionId}`);
  }
}

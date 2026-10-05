import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  DocumentoRequeridoCreate,
  DocumentoRequeridoOut,
  EmpresaReceptoraCreate,
  EmpresaReceptoraListItem,
  EmpresaReceptoraOut,
  EmpresaReceptoraUpdate,
  PreguntaBitacoraCreate,
  PreguntaBitacoraOut,
} from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/empresas`;

  /** GET /empresas -- el backend filtra solo ACTIVAS cuando el rol del token
   * es ESTUDIANTE; el Director las ve todas (CU-02). */
  listar(): Observable<EmpresaReceptoraListItem[]> {
    return this.http.get<EmpresaReceptoraListItem[]>(this.baseUrl);
  }

  obtener(empresaId: number): Observable<EmpresaReceptoraOut> {
    return this.http.get<EmpresaReceptoraOut>(`${this.baseUrl}/${empresaId}`);
  }

  // ---- CU-02 (Director) ----

  crear(data: EmpresaReceptoraCreate): Observable<EmpresaReceptoraOut> {
    return this.http.post<EmpresaReceptoraOut>(this.baseUrl, data);
  }

  actualizar(empresaId: number, data: EmpresaReceptoraUpdate): Observable<EmpresaReceptoraOut> {
    return this.http.put<EmpresaReceptoraOut>(`${this.baseUrl}/${empresaId}`, data);
  }

  /** Excepción 17.1.a: enunciado duplicado -> 409 `requiere_confirmacion`;
   * repetir con `confirmarDuplicado = true`. */
  agregarPregunta(
    empresaId: number,
    data: PreguntaBitacoraCreate,
    confirmarDuplicado = false,
  ): Observable<PreguntaBitacoraOut> {
    let params = new HttpParams();
    if (confirmarDuplicado) {
      params = params.set('confirmar_duplicado', 'true');
    }
    return this.http.post<PreguntaBitacoraOut>(`${this.baseUrl}/${empresaId}/preguntas`, data, { params });
  }

  agregarDocumentoRequerido(
    empresaId: number,
    data: DocumentoRequeridoCreate,
  ): Observable<DocumentoRequeridoOut> {
    return this.http.post<DocumentoRequeridoOut>(`${this.baseUrl}/${empresaId}/documentos-requeridos`, data);
  }

  /** Excepción 31.1.a: postulaciones pendientes -> 409 `requiere_confirmacion`;
   * repetir con `forzar = true`. */
  inactivar(empresaId: number, forzar = false): Observable<EmpresaReceptoraOut> {
    let params = new HttpParams();
    if (forzar) {
      params = params.set('forzar', 'true');
    }
    return this.http.patch<EmpresaReceptoraOut>(`${this.baseUrl}/${empresaId}/inactivar`, {}, { params });
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { EmpresaReceptoraListItem, EmpresaReceptoraOut } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/empresas`;

  /** GET /empresas -- el backend ya filtra solo ACTIVAS cuando el rol del
   * token es ESTUDIANTE (ver `app/routers/empresas.py`), así que el
   * frontend no necesita (ni puede) pedir las inactivas. */
  listar(): Observable<EmpresaReceptoraListItem[]> {
    return this.http.get<EmpresaReceptoraListItem[]>(this.baseUrl);
  }

  obtener(empresaId: number): Observable<EmpresaReceptoraOut> {
    return this.http.get<EmpresaReceptoraOut>(`${this.baseUrl}/${empresaId}`);
  }
}

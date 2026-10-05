import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ObjetivoPracticaCreate,
  ObjetivoPracticaDecision,
  ObjetivoPracticaOut,
} from '../models/objetivo.model';

/** CU-11 (lado Estudiante): plantear/reenviar y consultar los objetivos de
 * su práctica. La decisión del Docente Asesor (aprobar/rechazar) se
 * construirá en el rol correspondiente, no aquí. */
@Injectable({ providedIn: 'root' })
export class ObjetivoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/objetivos`;

  /** POST /objetivos -- sirve tanto para el envío inicial como para el
   * reenvío tras un rechazo (mismo endpoint, mismo cuerpo). */
  enviar(data: ObjetivoPracticaCreate): Observable<ObjetivoPracticaOut> {
    return this.http.post<ObjetivoPracticaOut>(this.baseUrl, data);
  }

  /** GET /objetivos/me -- devuelve 404 si el estudiante no tiene práctica
   * MATRICULADA, o si aún no ha planteado objetivos para ella. */
  obtenerMios(): Observable<ObjetivoPracticaOut> {
    return this.http.get<ObjetivoPracticaOut>(`${this.baseUrl}/me`);
  }

  // ---- CU-11 (Docente Asesor) ----

  listarPendientes(): Observable<ObjetivoPracticaOut[]> {
    return this.http.get<ObjetivoPracticaOut[]>(`${this.baseUrl}/pendientes`);
  }

  decidir(objetivoId: number, data: ObjetivoPracticaDecision): Observable<ObjetivoPracticaOut> {
    return this.http.patch<ObjetivoPracticaOut>(`${this.baseUrl}/${objetivoId}/decision`, data);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ObjetivoPracticaCreate, ObjetivoPracticaOut } from '../models/objetivo.model';

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
}

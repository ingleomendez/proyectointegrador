import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ArchivoSubidoOut {
  /** Ruta pública relativa devuelta por el backend (p. ej. `/uploads/<uuid>_cv.pdf`). */
  archivo: string;
}

/** Carga de archivos (`POST /archivos`). CU-06 acepta solo PDF; los soportes
 * de un avance (CU-08) aceptan además PNG/JPG -- se pide con
 * `permitirImagenes = true`. */
@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/archivos`;

  subir(archivo: File, permitirImagenes = false): Observable<ArchivoSubidoOut> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    let params = new HttpParams();
    if (permitirImagenes) {
      params = params.set('permitir_imagenes', 'true');
    }
    return this.http.post<ArchivoSubidoOut>(this.baseUrl, formData, { params });
  }

  /** URL absoluta para abrir/descargar un archivo ya subido. */
  urlPublica(ruta: string): string {
    return `${environment.apiUrl}${ruta}`;
  }
}

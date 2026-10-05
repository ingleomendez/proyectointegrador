import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface ArchivoSubidoOut {
  archivo: string;
}

/** Endpoint genérico de carga de archivos (`POST /archivos`), referenciado
 * por CU-06 pasos 12-15 ("el sistema valida que el archivo tenga formato
 * PDF" / "ruta-URL que entrega el endpoint de carga de archivos"). */
@Injectable({ providedIn: 'root' })
export class ArchivoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/archivos`;

  subir(archivo: File): Observable<ArchivoSubidoOut> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<ArchivoSubidoOut>(this.baseUrl, formData);
  }
}

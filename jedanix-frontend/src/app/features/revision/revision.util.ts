import { Observable, forkJoin, of } from 'rxjs';

import { AvanceSemanalListItem, AvanceSemanalOut } from '../../core/models/avance.model';
import { AvanceService } from '../../core/services/avance.service';

/** El listado de avances no trae la observación del Docente Asesor, así que
 * para saber cuáles siguen "pendientes de observación" (CU-10, paso 3) se
 * consulta el detalle de cada uno. `forkJoin([])` no emite, por eso se
 * devuelve una lista vacía de forma explícita. */
export function detallesDeAvances(
  avanceService: AvanceService,
  items: AvanceSemanalListItem[],
): Observable<AvanceSemanalOut[]> {
  return items.length ? forkJoin(items.map((i) => avanceService.obtener(i.id))) : of([]);
}

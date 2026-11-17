import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject } from '@angular/core';

/** Tablas que se ven bien en el celular.
 *
 * En pantallas angostas (ver `styles.scss`) cada fila de `table.tabla` se muestra
 * como una tarjeta y cada celda lleva delante el nombre de su columna. Ese
 * nombre sale del encabezado (`th`) y se copia al atributo `data-label` de cada
 * celda. Como las tablas se dibujan y redibujan solas (filtros, búsquedas, carga
 * de datos), un `MutationObserver` repite el rotulado cuando algo cambia, así no
 * hay que tocar el HTML de cada pantalla.
 *
 * Se llama una vez desde el armazón; se detiene al destruirse. */
export function instalarTablasResponsivas(): void {
  const documento = inject(DOCUMENT);
  const ventana = documento.defaultView;
  // Se observa todo el documento porque el armazón aún no ha dibujado `main.contenido`
  // cuando esta función se llama (desde su constructor).
  const cuerpo = documento.body;
  if (!ventana || !cuerpo || !('MutationObserver' in ventana)) {
    return;
  }

  let pendiente = 0;
  const programar = () => {
    if (pendiente) {
      return;
    }
    pendiente = ventana.requestAnimationFrame(() => {
      pendiente = 0;
      rotularTablas(cuerpo);
    });
  };

  const observador = new MutationObserver(programar);
  observador.observe(cuerpo, { childList: true, subtree: true });
  programar();

  inject(DestroyRef).onDestroy(() => {
    observador.disconnect();
    if (pendiente) {
      ventana.cancelAnimationFrame(pendiente);
    }
  });
}

function rotularTablas(raiz: Element): void {
  for (const tabla of Array.from(raiz.querySelectorAll<HTMLTableElement>('main.contenido table.tabla'))) {
    const encabezados = Array.from(tabla.querySelectorAll<HTMLElement>('thead th')).map(
      (th) => th.textContent?.trim() ?? '',
    );
    if (encabezados.length === 0) {
      continue;
    }
    for (const fila of Array.from(tabla.querySelectorAll<HTMLTableRowElement>('tbody tr'))) {
      Array.from(fila.cells).forEach((celda, indice) => {
        const rotulo = celda.colSpan > 1 ? '' : (encabezados[indice] ?? '');
        if (celda.getAttribute('data-label') !== rotulo) {
          celda.setAttribute('data-label', rotulo);
        }
      });
    }
  }
}

# Guía — Diagramas de actividades de JEDANIX (Astah)

Los dos diagramas ya están creados y guardados en el proyecto
`diagramas\prototipo2_completo_JEDANIX_v2.asta`, en el paquete **jedanix → actividades**.

## Qué muestra cada diagrama

**A1 — Proceso completo de una práctica (de la solicitud al cierre).**
Calles: Director, Estudiante, Docente Asesor, Coordinador de Práctica y Sistema.
Recorre el ciclo de vida completo: el Director crea usuarios y empresas (CU-01, CU-02); el estudiante se postula (CU-06); el Director aprueba o rechaza (CU-03); el estudiante plantea objetivos y el Docente Asesor los aprueba o rechaza (CU-11); el estudiante registra avances y el Coordinador los califica u observa (CU-08, CU-09); cuando las horas aceptadas alcanzan las requeridas, el Director decide el cierre (CU-05) y la práctica queda FINALIZADA. Los rechazos regresan al paso anterior (bucles).

**A2 — Seguimiento semanal: registrar, revisar y observar un avance.**
Calles: Estudiante, Sistema, Coordinador de Práctica y Docente Asesor.
Detalla CU-08, CU-09 y CU-10: el estudiante llena el formulario y sube soportes; el sistema valida (práctica MATRICULADA, objetivos APROBADOS, semana libre) y guarda el avance como PENDIENTE_DE_REVISION. Una barra de bifurcación (fork) abre tres ramas en paralelo: el sistema notifica, el Coordinador revisa y califica u observa, y el Docente Asesor registra una observación informativa (no cambia el estado). Si el Coordinador observa, el estudiante corrige y reenvía.

## Cómo leerlos (notación)

- Círculo negro = inicio. Círculo con borde = fin de la actividad. Círculo con X = fin de un flujo (la rama termina, pero el resto sigue).
- Rombo = decisión; el texto entre corchetes sobre la flecha es la condición (`[sí]`, `[no]`, `[sí califica]`…).
- Barra negra gruesa = bifurcación: las ramas siguientes ocurren en paralelo.
- Rectángulos de color de fondo = calles (quién hace cada actividad).

## Nota importante sobre las calles

Las calles son **rectángulos de color dibujados con texto de encabezado**, no particiones nativas de Astah (las nativas quedan de solo 35 px de ancho y no se pueden redimensionar por la API). Visualmente funcionan igual; si alguien mueve un nodo, debe arrastrarlo dentro de su calle.

## Cómo rehacerlos si se pierden

1. Abrir Astah con el proyecto → menú **Tools → Script Editor**.
2. Copiar en `JEDANIX\astah_import\` los archivos `build_act.js` y `actividades.json`.
3. Pegar el cargador del script y ejecutar. Al terminar, `log_act.txt` debe decir `OK A1… OK A2…`.
4. Cerrar el Script Editor y guardar (Ctrl+S).

El script borra y vuelve a crear el paquete `actividades`, así que se puede ejecutar de nuevo sin duplicar nada.

## Cómo editarlos a mano

- Cambiar un texto: doble clic sobre la actividad.
- Condición de una flecha: doble clic sobre la flecha → campo *Guard*.
- Para añadir una actividad: paleta de Activity → *Action* y dibujarla dentro de la calle; conectar con *Control flow*.

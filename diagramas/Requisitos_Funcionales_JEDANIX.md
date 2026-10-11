# JEDANIX — Requisitos funcionales

Cada requisito empieza con un verbo de acción y cubre por completo uno o más casos de uso del diagrama.

| ID | Requisito funcional | Actor | Caso de uso |
|---|---|---|---|
| RF-01 | **Autenticar y autorizar:** el sistema debe verificar la identidad de cada usuario mediante correo y contraseña, y restringir las funciones disponibles según su rol. | Todos | Precondición general |
| RF-02 | **Administrar perfil:** el sistema debe permitir a todo usuario consultar y actualizar su información personal y foto; al Estudiante, además, sus datos de residencia y salud. | Todos | Gestionar Perfil |
| RF-03 | **Administrar usuarios:** el sistema debe permitir al Director crear, modificar, inactivar y reactivar las cuentas de Estudiante, Coordinador de Práctica y Docente Asesor, entregándoles credenciales temporales por correo. | Director | CU-01 |
| RF-04 | **Parametrizar empresas receptoras:** el sistema debe permitir al Director registrar, modificar e inactivar empresas, definiendo sus horas requeridas, bitácora de postulación, documentos exigidos y los responsables (Coordinador y Docente Asesor). | Director | CU-02 |
| RF-05 | **Postular:** el sistema debe permitir al Estudiante postularse a una empresa receptora —adjuntando los documentos exigidos y respondiendo la bitácora—, guardar borradores y seguir el estado de su solicitud, con una sola postulación activa a la vez. | Estudiante | CU-06 |
| RF-06 | **Dictaminar solicitudes:** el sistema debe permitir al Director revisar las solicitudes pendientes y aprobarlas (matriculando al estudiante y asignándole responsables) o rechazarlas con un motivo. | Director | CU-03 |
| RF-07 | **Consultar práctica:** el sistema debe permitir al Estudiante consultar los datos de su práctica: empresa, responsables, horas acumuladas, porcentaje de avance y estado de sus objetivos. | Estudiante | CU-07 |
| RF-08 | **Formular objetivos:** el sistema debe permitir al Estudiante formular y reenviar los objetivos de su práctica, y al Docente Asesor aprobarlos o rechazarlos con observación; solo con objetivos aprobados se habilita el reporte de avances. | Estudiante, Docente Asesor | CU-11 |
| RF-09 | **Reportar avances:** el sistema debe permitir al Estudiante registrar su avance semanal (actividades, horas y soportes), consultar su historial y corregir los avances observados. | Estudiante | CU-08 |
| RF-10 | **Evaluar avances:** el sistema debe permitir al Coordinador de Práctica revisar los avances de sus estudiantes asignados y calificarlos (0.0 a 5.0) u observarlos para su corrección. | Coordinador | CU-09 |
| RF-11 | **Asesorar avances:** el sistema debe permitir al Docente Asesor revisar los avances de sus estudiantes asignados y registrar observaciones sobre ellos. | Docente Asesor | CU-10 |
| RF-12 | **Monitorear matriculados:** el sistema debe permitir al Director consultar a los estudiantes matriculados —sus horas acumuladas, porcentaje de cumplimiento e historial de avances— e identificar a quienes completaron los requisitos. | Director | CU-04 |
| RF-13 | **Formalizar cierre:** el sistema debe permitir al Director aprobar o rechazar el cierre de la práctica de un estudiante que completó sus horas, finalizándola cuando se aprueba. | Director | CU-05 |
| RF-14 | **Notificar:** el sistema debe informar por correo electrónico a los actores involucrados cada evento relevante del proceso (cuentas, solicitudes, objetivos, avances y cierre), reintentando los envíos fallidos. | Sistema | Transversal |

## Cobertura del diagrama

Los 12 casos de uso del diagrama (Gestionar Perfil y CU-01 a CU-11) quedan cubiertos cada uno por al menos un requisito; RF-01 y RF-14 cubren lo transversal (acceso y notificaciones).

| Actor | Requisitos |
|---|---|
| Director | RF-03, RF-04, RF-06, RF-12, RF-13 |
| Estudiante | RF-05, RF-07, RF-08, RF-09 |
| Coordinador de Práctica | RF-10 |
| Docente Asesor | RF-08, RF-11 |
| Todos / Sistema | RF-01, RF-02, RF-14 |

*La versión de 89 requisitos con todo el detalle quedó guardada como `Requisitos_Funcionales_JEDANIX_Detallado.md`, por si hace falta consultarla.*

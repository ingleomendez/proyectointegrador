/** Replica de `app/models/enums.py` (solo los enums que el frontend necesita
 * para distinguir pantallas y validar formularios). */

export enum RolEnum {
  ESTUDIANTE = 'ESTUDIANTE',
  DIRECTOR = 'DIRECTOR',
  COORDINADOR = 'COORDINADOR',
  DOCENTE_ASESOR = 'DOCENTE_ASESOR',
}

export enum UsuarioEstadoEnum {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

/** Replica de `UsuarioListItem` en `app/schemas/usuario.py`: la versión
 * resumida de un usuario que viaja anidada dentro de otras respuestas (p. ej.
 * el coordinador/docente asesor de una empresa). */
export interface UsuarioListItem {
  id: number;
  nombre_completo: string;
  correo_institucional: string;
  rol: RolEnum;
  estado: UsuarioEstadoEnum;
}

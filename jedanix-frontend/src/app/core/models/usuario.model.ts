import { FactorRhEnum, GrupoSanguineoEnum } from './enums.model';

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

/** Replica de `UsuarioOut`: usuario completo (Director en CU-01, y el propio
 * usuario en Gestionar Perfil). */
export interface UsuarioOut {
  id: number;
  nombre_completo: string;
  correo_institucional: string;
  celular: string | null;
  foto_perfil: string | null;
  rol: RolEnum;
  estado: UsuarioEstadoEnum;
  fecha_registro: string;
  programa_academico: string | null;
  direccion_residencia: string | null;
  grupo_sanguineo: GrupoSanguineoEnum | null;
  factor_rh: FactorRhEnum | null;
  eps: string | null;
}

/** Gestionar Perfil: campos editables por el propio usuario. */
export interface PerfilUpdate {
  nombre_completo: string;
  celular: string | null;
  foto_perfil: string | null;
  direccion_residencia: string | null;
  grupo_sanguineo: GrupoSanguineoEnum | null;
  factor_rh: FactorRhEnum | null;
  eps: string | null;
}

/** CU-01, pasos 6-16. */
export interface UsuarioCreate {
  nombre_completo: string;
  correo_institucional: string;
  rol: RolEnum;
  programa_academico: string | null;
}

/** CU-01, flujo alterno 4.1.a (el correo no es editable). */
export interface UsuarioUpdateDirector {
  nombre_completo: string;
  rol: RolEnum;
  programa_academico: string | null;
}

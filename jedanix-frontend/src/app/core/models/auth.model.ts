import { RolEnum } from './usuario.model';

/** Replica de `app/schemas/auth.py`. */

export interface LoginRequest {
  correo_institucional: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  usuario_id: number;
  nombre_completo: string;
  rol: RolEnum;
}

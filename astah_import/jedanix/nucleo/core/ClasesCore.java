package jedanix.nucleo.core;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.dominio.*;
import jedanix.nucleo.excepciones.*;
import jedanix.nucleo.repositories.*;
import jedanix.nucleo.routers.*;
import jedanix.nucleo.services.*;

class Settings {
    private String DATABASE_URL;
    private String SECRET_KEY;
    private String ALGORITHM;
    private int ACCESS_TOKEN_EXPIRE_MINUTES;
    private String NOTIFICACIONES_SERVICE_URL;
    private double NOTIFICACIONES_TIMEOUT_SECONDS;
    private int NOTIFICACIONES_REINTENTOS;
    private double NOTIFICACIONES_ESPERA_SEGUNDOS;
    private boolean NOTIFICACIONES_ASINCRONO;
    private String NOTIFICACIONES_API_KEY;
    private String ENVIRONMENT;
    private String CORS_ORIGINS;
    public List<String> cors_origins_lista() { throw new UnsupportedOperationException(); }
}

/** utility */
class Security {
    public String hash_password(String password) { throw new UnsupportedOperationException(); }
    public boolean verify_password(String plain, String hashed) { throw new UnsupportedOperationException(); }
    public String create_access_token(Map<String,Object> data, Integer expires_minutes) { throw new UnsupportedOperationException(); }
    public Map<String,Object> decode_access_token(String token) { throw new UnsupportedOperationException(); }
}

/** utility */
class Deps {
    private Security security;
    private UsuarioRepository usuario_repo;
    public Usuario get_current_usuario(Object credenciales, Session db) { throw new UnsupportedOperationException(); }
    public Object requiere_rol(RolEnum... roles) { throw new UnsupportedOperationException(); }
}

/** utility */
class Database {
    private Object engine;
    private Object SessionLocal;
    private Object Base;
    public Session get_db() { throw new UnsupportedOperationException(); }
}

/** client HTTP; hilo en segundo plano; reintenta 502/503/504/429 */
class NotificacionesClient {
    private Settings settings;
    public void notificar(String evento, String destinatario_correo, Map<String,Object> datos) { throw new UnsupportedOperationException(); }
    public boolean _enviar_con_reintentos(String evento, String destinatario_correo, Map<String,Object> payload, Map<String,String> headers) { throw new UnsupportedOperationException(); }
}

/** FastAPI app */
class AppMain {
    private Settings settings;
    public Map<String,Object> health() { throw new UnsupportedOperationException(); }
}

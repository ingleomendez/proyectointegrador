package jedanix.nucleo.excepciones;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.nucleo.core.*;
import jedanix.nucleo.dominio.*;
import jedanix.nucleo.repositories.*;
import jedanix.nucleo.routers.*;
import jedanix.nucleo.services.*;

abstract class ServiceError extends Exception {
}

/** HTTP 404 */
class NoEncontradoError extends ServiceError {
}

/** HTTP 400/422 */
class ReglaDeNegocioError extends ServiceError {
}

/** HTTP 409 */
class ConflictoError extends ServiceError {
}

/** HTTP 409 con requiere_confirmacion */
class RequiereConfirmacionError extends ServiceError {
    private Map<String,Object> detalle;
}

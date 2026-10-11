package jedanix.frontend.revision;

import java.util.*;
import java.time.*;
import java.math.*;
import jedanix.frontend.comun.*;
import jedanix.frontend.core.*;
import jedanix.frontend.director.*;
import jedanix.frontend.estudiante.*;
import jedanix.frontend.servicios.*;

/** component */
class EstudiantesLista {
    private AuthService authService;
    private AvanceService avanceService;
    private ObjetivoService objetivoService;
    private PostulacionService postulacionService;
}

/** component */
class EstudianteDetalle {
    private AuthService authService;
    private AvanceService avanceService;
    private ObjetivoService objetivoService;
    private PostulacionService postulacionService;
}

/** component */
class AvanceRevision {
    private ArchivoService archivoService;
    private AuthService authService;
    private AvanceService avanceService;
}

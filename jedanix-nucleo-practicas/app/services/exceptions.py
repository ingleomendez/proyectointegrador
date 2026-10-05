from __future__ import annotations


class ServiceError(Exception):
    """Excepción base de la capa de servicio. No conoce FastAPI: la capa de
    routers (siguiente paso) la captura y la traduce al código HTTP
    correspondiente (ver subclases para el mapeo sugerido)."""


class NoEncontradoError(ServiceError):
    """El recurso solicitado no existe. Sugerido -> HTTP 404."""


class ReglaDeNegocioError(ServiceError):
    """Se violó una regla de negocio explícita de un caso de uso (un campo
    obligatorio según el estado, una precondición no cumplida, etc.).
    Sugerido -> HTTP 400/422."""


class ConflictoError(ServiceError):
    """La operación entra en conflicto con el estado actual de los datos
    (p. ej. una postulación activa duplicada, un avance ya registrado para
    esa semana, un estudiante matriculado en otra empresa mientras se
    revisaba su solicitud). Sugerido -> HTTP 409."""


class RequiereConfirmacionError(ServiceError):
    """La operación es válida pero el caso de uso exige mostrarle al actor
    una advertencia y pedirle confirmación explícita antes de aplicarla
    (CU-01 excepción 6.1.a y 4.1.b.1, CU-02 excepción 17.1.a y 31.1.a). El
    router debe mostrarle `detalle` al usuario y, si confirma, repetir la
    llamada al servicio con el parámetro de confirmación correspondiente en
    `True`. Sugerido -> HTTP 409 con `detalle` en el cuerpo de la respuesta."""

    def __init__(self, mensaje: str, detalle: dict | None = None) -> None:
        super().__init__(mensaje)
        self.detalle = detalle or {}

-- JEDANIX - Notificaciones: esquema de su base de datos PROPIA.
-- No comparte tablas ni claves foráneas con jedanix_nucleo (Arquitectura_JEDANIX_v2.md).
-- Es idempotente: se ejecuta automáticamente al arrancar el servicio.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificacion_estado') THEN
        CREATE TYPE notificacion_estado AS ENUM ('PENDIENTE', 'ENVIADA', 'FALLIDA');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS notificaciones (
    id                  SERIAL PRIMARY KEY,
    evento              VARCHAR(60)  NOT NULL,
    destinatario_correo VARCHAR(255) NOT NULL,
    asunto              VARCHAR(255) NOT NULL,
    datos               JSONB        NOT NULL DEFAULT '{}'::jsonb,
    estado              notificacion_estado NOT NULL DEFAULT 'PENDIENTE',
    canal               VARCHAR(20),               -- 'SMTP' | 'SIMULADO' (se llena al enviar)
    intentos            INTEGER      NOT NULL DEFAULT 0,
    ultimo_error        TEXT,
    creada_en           TIMESTAMP    NOT NULL DEFAULT now(),
    actualizada_en      TIMESTAMP    NOT NULL DEFAULT now(),
    enviada_en          TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_notificaciones_estado ON notificaciones (estado);
CREATE INDEX IF NOT EXISTS ix_notificaciones_destinatario ON notificaciones (destinatario_correo);

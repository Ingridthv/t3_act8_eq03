-- Celular real de contacto: a él llegan los avisos por SMS y WhatsApp (Twilio).
-- Si está vacío se usa el teléfono del alumno o docente.
ALTER TABLE usuarios ADD COLUMN telefono_contacto varchar(15);

-- Correo real de contacto: a él llegan la recuperación de contraseña y los avisos.
-- El correo institucional (usuarios.correo) sigue siendo solo el usuario para iniciar sesión.
ALTER TABLE usuarios ADD COLUMN correo_contacto text;

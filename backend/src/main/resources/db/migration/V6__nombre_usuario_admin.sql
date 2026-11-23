-- Nombre visible de los usuarios administradores (los alumnos y docentes lo toman de su propia tabla).
ALTER TABLE usuarios ADD COLUMN nombre text;

-- Catálogo de carreras: la base de datos queda igual al catálogo del frontend (8 carreras, 9 semestres).

-- 1) Ajusta las 5 carreras existentes (se conservan los id para no romper alumnos ni materias)
UPDATE carreras SET clave = 'ISC', nombre = 'Ing. en Sistemas',    duracion_semestres = 9 WHERE id = 1;
UPDATE carreras SET clave = 'IIN', nombre = 'Ing. Industrial',      duracion_semestres = 9 WHERE id = 2;
UPDATE carreras SET clave = 'LPS', nombre = 'Lic. Psicología',      duracion_semestres = 9 WHERE id = 3;
UPDATE carreras SET clave = 'LDE', nombre = 'Lic. Derecho',         duracion_semestres = 9 WHERE id = 4;
UPDATE carreras SET clave = 'LAR', nombre = 'Lic. Arquitectura',    duracion_semestres = 9 WHERE id = 5;

-- 2) Los id 1-5 se insertaron a mano en V2, así que la secuencia sigue en 1.
--    Se sincroniza para que las carreras nuevas (también las del CRUD) no choquen con ellos.
SELECT setval(pg_get_serial_sequence('carreras', 'id'), (SELECT max(id) FROM carreras));

-- 3) Las 3 carreras que faltaban (coordinan docentes que aún no coordinaban ninguna)
INSERT INTO carreras (clave, nombre, duracion_semestres, coordinador_id, activa) VALUES
('LEP', 'Lic. en Educación Primaria', 9, '0ac1a300-6a94-50f0-ac90-247e70848f19', true),
('LEF', 'Lic. en Educación Física',   9, '8e065c69-abd6-5659-b303-19b277533b74', true),
('LAO', 'Lic. Administración',        9, 'ce1a6bc3-b451-5447-9b00-fdf042440463', true);

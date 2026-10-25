# t3_act8_eq03 — Control Alumnos
## Programacion Web  09:00-10:00 am!

Mini sistema en React (Vite) basado en el mockup de Figma de la Actividad 7.

## Integrantes
- Arcadio Aparicio Ingrid
- Hernández Guzmán Concepción Escarleth

## Descripción del proyecto
```
En esta actividad realizamos un sistema de control de alumnos utilizando React y Vite, tomando como referencia el mockup de Figma de la Actividad 7.

El sistema permite consultar la información de los alumnos, realizar búsquedas, aplicar filtros y administrar sus datos mediante las opciones de agregar, editar y eliminar.
```
## API de la tabla de datos
**DummyJSON usuarios** (`https://dummyjson.com/users`), usados como alumnos.

## APIs de validación
- DummyJSON `/auth/login`: inicio de sesión.
- Disify: verifica que el correo sea válido y no desechable.
- Zippopotam.us: del código postal obtiene el estado.
- Have I Been Pwned (Pwned Passwords): avisa si la contraseña apareció en filtraciones.
- DiceBear: foto de los alumnos creados desde la app.

## Proyecto desplegado


## Ejecutar
```bash
npm install
npm run dev      # desarrollo
npm run build    # producción (carpeta dist/)
```

## Despliegue en el VPS
1. En `vite.config.js` cambia `base` a `'/t3_act8_eq03/'` con su número de equipo real.
2. `npm run build`
3. Sube el **contenido** de `dist/` a la carpeta que sirve Nginx, por ejemplo `/var/www/html/t3_act8_eq03/`:
   `scp -r dist/* usuario@IP_DE_SU_VPS:/var/www/html/t3_act8_eq03/`
4. Abre `http://IP_DE_SU_VPS/t3_act8_eq03/` y prueba.

## Estructura
```
src/
  components/  layout/ (Sidebar, Navbar, rutas protegidas) · ui/ · users/
  context/     AuthContext (usuario en estado)
  hooks/       useUsers (carga y CRUD)
  pages/       LoginPage · DashboardPage · UsersPage
  services/    api.js · validation.js
  utils/
```

## Fotografías de los alumnos
```
Para mostrar las fotografías utilizamos Random User.

https://randomuser.me/

Este servicio proporciona fotografías reales de demostración. En nuestro código utilizamos el ID de cada alumno para asignarle una imagen diferente y seleccionar fotografías de hombres o mujeres.

Las imágenes se cargan directamente desde internet y, si alguna no se puede mostrar, aparecen las iniciales del alumno.
```

## Paginación
```
La tabla muestra 10 alumnos por página. Como trabajamos con 100 alumnos inicialmente, tenemos 10 páginas.

Agregamos botones para avanzar, regresar y seleccionar una página.
```
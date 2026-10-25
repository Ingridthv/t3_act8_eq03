
import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { getFullName, getInitials } from '../../utils/users.js';

// Cantidad de fotografias disponibles por grupo
const PHOTOS_PER_GROUP = 100;

// Componente para mostrar la fotografia del alumno
function StudentPhoto({ user }) {
  const [imageError, setImageError] = useState(false);

  const fullName = getFullName(user);

  // Utilizar el ID para asignar una fotografia estable
  const studentId = Number(user.id);

  // El genero de demostracion se asigna en users.js
  const isFemale = user.demoGender === 'female';

  // Los alumnos de demostracion alternan entre mujeres y hombres.
  // Esto permite utilizar fotografias distintas para los primeros
  // 100 alumnos de cada grupo.
  const photoNumber = Math.floor(studentId / 2);

  // Seleccionar la carpeta de fotografias reales
  const folder = isFemale ? 'women' : 'men';

  // Evitar repetir fotografias cuando se agote el catalogo
  const hasPhoto =
    Number.isInteger(studentId) &&
    studentId >= 1 &&
    photoNumber >= 0 &&
    photoNumber < PHOTOS_PER_GROUP &&
    (user.demoGender === 'female' ||
      user.demoGender === 'male');

  // Si no hay fotografia disponible, mostrar iniciales
  if (!hasPhoto || imageError) {
    return (
      <Avatar
        initials={getInitials(user)}
        size="sm"
      />
    );
  }

  // Fotografias reales de demostracion
  const photo =
    `https://randomuser.me/api/portraits/${folder}/${photoNumber}.jpg`;

  return (
    <img
      src={photo}
      alt={`Fotografía ilustrativa de ${fullName}`}
      loading="lazy"
      onError={() => setImageError(true)}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: '2px solid #ead8c0',
        backgroundColor: '#f8f3eb',
      }}
    />
  );
}

// Tabla principal de alumnos
export default function UsersTable({
  users,
  onEdit,
  onDelete,
}) {
  return (
    <div className="table-wrap">
      <table
        className="data-table"
        style={{ minWidth: 900 }}
      >
        <colgroup>
          <col style={{ width: '11.2%' }} />
          <col style={{ width: '24.3%' }} />
          <col style={{ width: '18.7%' }} />
          <col style={{ width: '9.4%' }} />
          <col style={{ width: '9.4%' }} />
          <col style={{ width: '11.2%' }} />
          <col style={{ width: '15.7%' }} />
        </colgroup>

        <thead>
          <tr>
            <th scope="col">Matrícula</th>
            <th scope="col">Nombre</th>
            <th scope="col">Carrera</th>
            <th scope="col">Semestre</th>
            <th scope="col">Promedio</th>
            <th scope="col">Estatus</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                className="data-table__empty"
                colSpan={7}
              >
                No se encontraron alumnos.
                Cambia la búsqueda o limpia los filtros.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const fullName = getFullName(user);

              return (
                <tr key={user.id}>
                  {/* Matricula */}
                  <td>{user.enrollment}</td>

                  {/* Nombre y fotografia */}
                  <td>
                    <div className="data-table__person">
                      <StudentPhoto
                        key={user.id}
                        user={user}
                      />

                      <span className="data-table__name">
                        {fullName}
                      </span>
                    </div>
                  </td>

                  {/* Carrera */}
                  <td>{user.career}</td>

                  {/* Semestre */}
                  <td>{user.semester}</td>

                  {/* Promedio */}
                  <td className="data-table__strong">
                    {user.average}
                  </td>

                  {/* Estatus */}
                  <td>
                    <span
                      className={`tag tag--${
                        user.status === 'Baja'
                          ? 'baja'
                          : 'activo'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  {/* Botones de acciones */}
                  <td>
                    <div className="data-table__actions">
                      {/* Editar alumno */}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => onEdit(user)}
                        aria-label={`Editar a ${fullName}`}
                      >
                        <Pencil size={16} />
                      </button>

                      {/* Eliminar alumno */}
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        onClick={() => onDelete(user)}
                        aria-label={`Eliminar a ${fullName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

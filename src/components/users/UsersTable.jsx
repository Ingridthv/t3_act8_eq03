import { Pencil, Trash2 } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { getFullName, getInitials } from '../../utils/users.js';

export default function UsersTable({ users, onEdit, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="data-table" style={{ minWidth: 900 }}>
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
              <td className="data-table__empty" colSpan={7}>
                No se encontraron alumnos. Cambia la búsqueda o limpia los filtros.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const fullName = getFullName(user);
              return (
                <tr key={user.id}>
                  <td>{user.enrollment}</td>
                  <td>
                    <div className="data-table__person">
                      <Avatar initials={getInitials(user)} size="sm" />
                      <span className="data-table__name">{fullName}</span>
                    </div>
                  </td>
                  <td>{user.career}</td>
                  <td>{user.semester}</td>
                  <td className="data-table__strong">{user.average}</td>
                  <td>
                    <span className={`tag tag--${user.status === 'Baja' ? 'baja' : 'activo'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                      <div className="data-table__actions">
                        <button type="button" className="icon-button" onClick={() => onEdit(user)}
                          aria-label={`Editar a ${fullName}`}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-button icon-button--danger" onClick={() => onDelete(user)}
                          aria-label={`Eliminar a ${fullName}`}>
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
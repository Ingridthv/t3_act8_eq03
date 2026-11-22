import { useOutletContext } from 'react-router-dom';

export default function DocentePerfilPage() {
  const { perfil } = useOutletContext();

  return (
    <div className="page">
      <section className="card">
        <div className="card__header">
          <div>
            <h2 className="card__title">Mi información</h2>
            <p style={{ color: 'var(--gris)' }}>Datos de tu cuenta docente</p>
          </div>
          <span className="tag tag--rol">Docente</span>
        </div>

        <div className="settings-grid">
          <div className="profile">
            <div className="logo-mark" style={{ width: 56, height: 56, fontSize: 22 }}>
              {perfil?.nombre?.charAt(0)}
            </div>
            <div>
              <p className="profile__name">
                {perfil?.nombre} {perfil?.apellidos}
              </p>
              <p style={{ color: 'var(--gris)' }}>{perfil?.correo}</p>
            </div>
          </div>

          <div>
            <p><strong>Clave docente:</strong> {perfil?.clave}</p>
            <p style={{ marginTop: 10 }}>
              <strong>Teléfono:</strong> {perfil?.telefono || 'No registrado'}
            </p>
            <p style={{ marginTop: 10 }}>
              <strong>Estado:</strong>{' '}
              <span className="tag tag--activo">{perfil?.estatus || 'Activo'}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
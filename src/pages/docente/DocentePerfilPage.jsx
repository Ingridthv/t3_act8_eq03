import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { changePasswordRequest } from '../../services/api.js';
import { PERIODO_ACTUAL } from './utilsDocente.js';
import './DocenteGruposPage.css';
import './DocenteExtras.css';

export default function DocentePerfilPage() {
  const { user } = useAuth();
  const { perfil, grupos } = useOutletContext();

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const nombre = `${perfil?.nombre || ''} ${perfil?.apellidos || ''}`.trim();
  const iniciales = `${perfil?.nombre?.[0] || ''}${perfil?.apellidos?.[0] || ''}`.toUpperCase();
  const estatus = perfil?.estatus
    ? perfil.estatus.charAt(0).toUpperCase() + perfil.estatus.slice(1)
    : 'Activo';

  // carreras de los grupos del docente (si la API ya las manda)
  const carreras = [...new Set(grupos.map((g) => g.carrera).filter(Boolean))].join(', ') || '—';
  const gruposActivos = grupos.filter((g) => g.periodo === PERIODO_ACTUAL).length;

  // requisitos de la contraseña nueva
  const reglas = [
    { texto: 'Mínimo 8 caracteres', cumple: nueva.length >= 8 },
    { texto: 'Una mayúscula', cumple: /[A-Z]/.test(nueva) },
    { texto: 'Un número', cumple: /\d/.test(nueva) },
    { texto: 'Un carácter especial', cumple: /[^A-Za-z0-9]/.test(nueva) }
  ];
  const todasCumplen = reglas.every((r) => r.cumple);
  const noCoinciden = confirmar !== '' && confirmar !== nueva;
  const puedeEnviar = actual !== '' && todasCumplen && confirmar === nueva && !enviando;

  async function actualizar() {
    setMensaje('');
    setError('');
    setEnviando(true);
    try {
      await changePasswordRequest(user.token, { actual, nueva });
      setMensaje('Contraseña actualizada correctamente.');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la contraseña.');
    } finally {
      setEnviando(false);
    }
  }

  const datos = [
    ['Nombre completo', nombre],
    ['Correo electrónico', perfil?.correo],
    ['Clave de docente', perfil?.clave],
    ['Carrera', carreras],
    ['Grupos activos', gruposActivos],
    ['Estatus', estatus]
  ];

  return (
    <section className="dg-card">
      <h2 className="dg-title">Mi perfil</h2>

      <div className="dc-cabecera">
        <div className="dc-avatar dc-avatar--grande">{iniciales}</div>
        <div>
          <p className="dc-cabecera__nombre">{nombre}</p>
          <p className="dc-cabecera__sub">Clave {perfil?.clave} · {carreras}</p>
          <span className="dg-badge dg-badge--ok">{estatus}</span>
        </div>
      </div>

      <hr className="dc-linea" />

      <h3 className="dc-subtitulo">Datos personales</h3>
      <div className="dc-grid2">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="dc-campo">
            <label>{etiqueta}</label>
            <div className="dc-campo__valor">{valor ?? '—'}</div>
          </div>
        ))}
      </div>

      <hr className="dc-linea" />

      <h3 className="dc-subtitulo">Cambiar contraseña</h3>
      <div className="dc-grid3">
        <div className="dc-campo">
          <label>Contraseña actual</label>
          <input
            className="dc-entrada"
            type="password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>
        <div className="dc-campo">
          <label>Nueva contraseña</label>
          <input
            className="dc-entrada"
            type="password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
        </div>
        <div className="dc-campo">
          <label>Confirmar nueva contraseña</label>
          <input
            className={'dc-entrada' + (noCoinciden ? ' dc-entrada--error' : '')}
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
          />
          {noCoinciden && <small className="dc-error-chico">Las contraseñas no coinciden</small>}
        </div>
      </div>

      <div className="dc-reglas">
        {reglas.map((r) => (
          <span key={r.texto} className={r.cumple ? 'dc-regla dc-regla--ok' : 'dc-regla'}>
            <i /> {r.texto}
          </span>
        ))}
      </div>

      {error && <p className="dc-error">{error}</p>}
      {mensaje && <p className="dc-exito">{mensaje}</p>}

      <button
        type="button"
        className="dc-guardar"
        disabled={!puedeEnviar}
        onClick={actualizar}
      >
        {enviando ? 'Actualizando…' : 'Actualizar contraseña'}
      </button>
    </section>
  );
}

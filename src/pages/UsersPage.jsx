import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '../components/ui/Alert.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import Modal from '../components/ui/Modal.jsx';
import Pagination from '../components/users/Pagination.jsx';
import UserForm from '../components/users/UserForm.jsx';
import UsersFilters from '../components/users/UsersFilters.jsx';
import UsersTable from '../components/users/UsersTable.jsx';
import { useUsers } from '../context/UsersContext.jsx';
import {
  EMPTY_USER_FORM,
  LIMIT_OPTIONS,
  getFullName,
  userToForm,
} from '../utils/users.js';

const NOTICE_DURATION_MS = 5000;

export default function UsersPage() {
  const { users, loading, error, reload, addUser, editUser, removeUser } = useUsers();
  const [searchParams, setSearchParams] = useSearchParams();

  const [formModal, setFormModal] = useState(null); // { mode: 'create' | 'edit', user? }
  const [pendingEdit, setPendingEdit] = useState(null); // { user, values }
  const [userToDelete, setUserToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null); // { type, text }

  /* ---------- Filtros y paginación (todo vive en la URL) ---------- */
  const search = searchParams.get('q') ?? '';
  const career = searchParams.get('career') ?? '';
  const semester = searchParams.get('semester') ?? '';
  const status = searchParams.get('status') ?? '';
  const requestedLimit = Number(searchParams.get('limit'));
  const limit = LIMIT_OPTIONS.includes(requestedLimit) ? requestedLimit : LIMIT_OPTIONS[0];
  const requestedPage = Math.max(1, Number(searchParams.get('page')) || 1);

  const updateParams = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace });
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesText =
        !term ||
        getFullName(user).toLowerCase().includes(term) ||
        String(user.email ?? '').toLowerCase().includes(term) ||
        String(user.enrollment).includes(term);
      return (
        matchesText &&
        (!career || user.career === career) &&
        (!semester || String(user.semester) === semester) &&
        (!status || user.status === status)
      );
    });
  }, [users, search, career, semester, status]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / limit));
  const page = Math.min(requestedPage, totalPages);
  const pageUsers = filteredUsers.slice((page - 1) * limit, page * limit);

  const handleSearchChange = (value) => updateParams({ q: value, page: 1, limit }, { replace: true });
  const handleFilterChange = (name, value) =>
    updateParams({ [name]: value, page: 1, limit }, { replace: true });
  const handleClearFilters = () =>
    updateParams({ q: '', career: '', semester: '', status: '', page: 1, limit });
  const handleLimitChange = (value) => updateParams({ limit: value, page: 1 });
  const handlePageChange = (value) => updateParams({ page: value, limit });

  /* ---------- Acciones que llegan desde Inicio (?edit=ID / ?delete=ID) ---------- */
  useEffect(() => {
    if (loading || error) return;
    const editId = Number(searchParams.get('edit'));
    const deleteId = Number(searchParams.get('delete'));
    if (!editId && !deleteId) return;
    const target = users.find((user) => user.id === (editId || deleteId));
    if (target) {
      if (editId) setFormModal({ mode: 'edit', user: target });
      else setUserToDelete(target);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    next.delete('delete');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, error, users, searchParams]);

  /* ---------- Avisos ---------- */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  const closeModals = () => {
    setFormModal(null);
    setPendingEdit(null);
    setUserToDelete(null);
    setActionError('');
  };

  /* ---------- Acciones CRUD ---------- */
  const handleCreateSubmit = async (values) => {
    setBusy(true);
    setActionError('');
    try {
      await addUser(values);
      closeModals();
      setNotice({ type: 'success', text: 'Alumno agregado. La API respondió correctamente.' });
      updateParams({ page: 1, limit });
    } catch (err) {
      setActionError(err.message || 'No se pudo agregar al alumno.');
    } finally {
      setBusy(false);
    }
  };

  const handleEditSubmit = (values) => {
    setActionError('');
    setPendingEdit({ user: formModal.user, values });
  };

  const handleConfirmEdit = async () => {
    setBusy(true);
    setActionError('');
    try {
      await editUser(pendingEdit.user, pendingEdit.values);
      closeModals();
      setNotice({ type: 'success', text: 'Cambios guardados correctamente.' });
    } catch (err) {
      setActionError(err.message || 'No se pudieron guardar los cambios.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    setActionError('');
    try {
      await removeUser(userToDelete);
      closeModals();
      setNotice({ type: 'success', text: 'Alumno eliminado correctamente.' });
    } catch (err) {
      setActionError(err.message || 'No se pudo eliminar al alumno.');
    } finally {
      setBusy(false);
    }
  };

  const openDelete = (user) => {
    setActionError('');
    setUserToDelete(user);
  };
  const openEdit = (user) => {
    setActionError('');
    setFormModal({ mode: 'edit', user });
  };
  const openCreate = () => {
    setActionError('');
    setFormModal({ mode: 'create' });
  };

  /* ---------- Render ---------- */
  return (
    <div className="page">
      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <section className="card">
        <header className="card__header">
          <h2 className="card__title">Lista de alumnos</h2>
          <button type="button" className="btn btn--primary" onClick={openCreate} disabled={loading || Boolean(error)}>
            + Nuevo alumno
          </button>
        </header>

        {loading && <LoadingState message="Cargando alumnos..." />}
        {!loading && error && <ErrorState message={error} onRetry={reload} />}

        {!loading && !error && (
          <>
            <UsersFilters
              search={search}
              career={career}
              semester={semester}
              status={status}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />
            <UsersTable users={pageUsers} onEdit={openEdit} onDelete={openDelete} />
            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalItems={filteredUsers.length}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </section>

      {formModal && (
        <Modal
          title={formModal.mode === 'create' ? 'Nuevo alumno' : 'Editar alumno'}
          subtitle={
            formModal.mode === 'create'
              ? 'Captura los datos del alumno para darlo de alta'
              : 'Modifica los datos del alumno'
          }
          onClose={closeModals}
          closeDisabled={busy || Boolean(pendingEdit)}
        >
          <UserForm
            key={formModal.user?.id ?? 'new'}
            initialValues={formModal.mode === 'create' ? EMPTY_USER_FORM : userToForm(formModal.user)}
            submitLabel={formModal.mode === 'create' ? 'Guardar alumno' : 'Guardar cambios'}
            submitting={busy && !pendingEdit}
            serverError={pendingEdit ? '' : actionError}
            onSubmit={formModal.mode === 'create' ? handleCreateSubmit : handleEditSubmit}
            onCancel={closeModals}
          />
        </Modal>
      )}

      {pendingEdit && (
        <ConfirmDialog
          title="¿Guardar los cambios?"
          message={`Se actualizarán los datos de ${getFullName(pendingEdit.user)}.`}
          confirmLabel="Sí, guardar"
          loading={busy}
          error={actionError}
          onConfirm={handleConfirmEdit}
          onCancel={() => {
            setPendingEdit(null);
            setActionError('');
          }}
        />
      )}

      {userToDelete && (
        <ConfirmDialog
          tone="danger"
          title="¿Eliminar alumno?"
          message={`Se eliminará a ${getFullName(userToDelete)} del sistema. Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          loading={busy}
          error={actionError}
          onConfirm={handleConfirmDelete}
          onCancel={closeModals}
        />
      )}
    </div>
  );
}

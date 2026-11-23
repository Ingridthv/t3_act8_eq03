
import { useCallback, useEffect, useState } from 'react';
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

import { useServerList } from '../hooks/useServerList.js';
import * as alumnosApi from '../services/alumnosApi.js';
import { options as loadOptions } from '../services/adminApi.js';

import {
  EMPTY_USER_FORM,
  getFullName,
  userToForm,
} from '../utils/users.js';

const NOTICE_DURATION_MS = 5000;

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [formModal, setFormModal] = useState(null);
  const [pendingEdit, setPendingEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState(null);

  // opciones de los selects (vienen de la base de datos)
  const [careers, setCareers] = useState([]);
  const [ingresos, setIngresos] = useState([]);

  useEffect(() => {
    loadOptions('carreras').then(setCareers).catch(() => {});
    loadOptions('ingresos').then(setIngresos).catch(() => {});
  }, []);

  // FILTROS (se guardan en la URL)
  const search = searchParams.get('q') ?? '';
  const career = searchParams.get('career') ?? '';
  const semester = searchParams.get('semester') ?? '';
  const status = searchParams.get('status') ?? '';
  const ingreso = searchParams.get('ingreso') ?? '';

  const requestedPage = Math.max(
    1,
    Number.parseInt(searchParams.get('page'), 10) || 1
  );

  const updateParams = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);

    next.delete('limit');

    Object.entries(patch).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    setSearchParams(next, { replace });
  };

  // El servidor busca, filtra y pagina
  const params = { page: requestedPage, q: search, career, semester, status, ingreso };
  const fetcher = useCallback((p) => alumnosApi.list(p), []);
  const { data, loading, error, reload } = useServerList(fetcher, params);

  const pageUsers = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const page = Math.min(requestedPage, totalPages);
  const limit = 10;

  // CAMBIOS DE FILTROS
  const handleSearchChange = (value) => {
    updateParams(
      { q: value, page: 1 },
      { replace: true }
    );
  };

  const handleFilterChange = (name, value) => {
    updateParams(
      { [name]: value, page: 1 },
      { replace: true }
    );
  };

  const handleClearFilters = () => {
    updateParams({
      q: '',
      career: '',
      semester: '',
      status: '',
      ingreso: '',
      page: 1,
    });
  };

  // CAMBIAR DE PAGINA
  const handlePageChange = (value) => {
    const nextPage = Math.min(
      totalPages,
      Math.max(1, Number(value) || 1)
    );

    updateParams({ page: nextPage });
  };

  // Mantener fijo el limite en 10
  const handleLimitChange = () => {
    updateParams({ page: 1 });
  };

  // ACCIONES DESDE INICIO (?edit=id / ?delete=id)
  useEffect(() => {
    const editId = searchParams.get('edit');
    const deleteId = searchParams.get('delete');
    if (!editId && !deleteId) return;

    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    next.delete('delete');
    setSearchParams(next, { replace: true });

    alumnosApi
      .get(editId || deleteId)
      .then((target) => {
        if (editId) setFormModal({ mode: 'edit', user: target });
        else setUserToDelete(target);
      })
      .catch((err) => setNotice({ type: 'error', text: err.message || 'No se encontró al alumno.' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // AVISOS
  useEffect(() => {
    if (!notice) return undefined;

    const timer = setTimeout(() => {
      setNotice(null);
    }, NOTICE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [notice]);

  const closeModals = () => {
    setFormModal(null);
    setPendingEdit(null);
    setUserToDelete(null);
    setActionError('');
  };

  // REGISTRAR ALUMNO
  const handleCreateSubmit = async (values) => {
    setBusy(true);
    setActionError('');

    try {
      await alumnosApi.create(values);

      closeModals();

      setNotice({
        type: 'success',
        text: 'Alumno agregado. Se enviaron sus credenciales a su correo de contacto.',
      });

      updateParams({ page: 1 });
      reload();
    } catch (err) {
      setActionError(
        err.message || 'No se pudo agregar al alumno.'
      );
    } finally {
      setBusy(false);
    }
  };

  // EDITAR ALUMNO
  const handleEditSubmit = (values) => {
    setActionError('');

    setPendingEdit({
      user: formModal.user,
      values,
    });
  };

  const handleConfirmEdit = async () => {
    setBusy(true);
    setActionError('');

    try {
      await alumnosApi.update(
        pendingEdit.user.id,
        pendingEdit.values
      );

      closeModals();
      reload();

      setNotice({
        type: 'success',
        text: 'Cambios guardados correctamente.',
      });
    } catch (err) {
      setActionError(
        err.message || 'No se pudieron guardar los cambios.'
      );
    } finally {
      setBusy(false);
    }
  };

  // ELIMINAR ALUMNO
  const handleConfirmDelete = async () => {
    setBusy(true);
    setActionError('');

    try {
      await alumnosApi.remove(userToDelete.id);

      closeModals();
      reload();

      setNotice({
        type: 'success',
        text: 'Alumno eliminado correctamente.',
      });
    } catch (err) {
      setActionError(
        err.message || 'No se pudo eliminar al alumno.'
      );
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
    setFormModal({
      mode: 'edit',
      user,
    });
  };

  // (los alumnos nuevos se dan de alta desde Inscripciones)
  // eslint-disable-next-line no-unused-vars
  const openCreate = () => {
    setActionError('');
    setFormModal({ mode: 'create' });
  };

  // INTERFAZ
  return (
    <div className="page">
      {notice && (
        <Alert
          type={notice.type}
          onClose={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      )}

      <section className="card">
        <header className="card__header">
          <h2 className="card__title">
            Lista de alumnos
          </h2>
        </header>

        {loading && !data && (
          <LoadingState message="Cargando alumnos..." />
        )}

        {error && (
          <ErrorState
            message={error}
            onRetry={reload}
          />
        )}

        {data && !error && (
          <>
            <UsersFilters
              search={search}
              career={career}
              semester={semester}
              status={status}
              ingreso={ingreso}
              careers={careers}
              ingresos={ingresos}
              onSearchChange={handleSearchChange}
              onFilterChange={handleFilterChange}
              onClear={handleClearFilters}
            />

            <UsersTable
              users={pageUsers}
              onEdit={openEdit}
              onDelete={openDelete}
            />

            <Pagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          </>
        )}
      </section>

      {formModal && (
        <Modal
          title={
            formModal.mode === 'create'
              ? 'Nuevo alumno'
              : 'Editar alumno'
          }
          subtitle={
            formModal.mode === 'create'
              ? 'Captura los datos del alumno para darlo de alta'
              : 'Modifica los datos del alumno'
          }
          onClose={closeModals}
          closeDisabled={
            busy || Boolean(pendingEdit)
          }
        >
          <UserForm
            key={formModal.user?.id ?? 'new'}
            careers={careers}
            mode={formModal.mode}
            initialValues={
              formModal.mode === 'create'
                ? EMPTY_USER_FORM
                : userToForm(formModal.user)
            }
            submitLabel={
              formModal.mode === 'create'
                ? 'Guardar alumno'
                : 'Guardar cambios'
            }
            submitting={busy && !pendingEdit}
            serverError={
              pendingEdit ? '' : actionError
            }
            onSubmit={
              formModal.mode === 'create'
                ? handleCreateSubmit
                : handleEditSubmit
            }
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

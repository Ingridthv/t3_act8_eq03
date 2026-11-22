import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import EstudianteLayout from './components/layout/EstudianteLayout.jsx';
import { HomeRedirect, PublicOnly, RequireAuth, RequireRole } from './components/layout/RouteGuards.jsx';
import CambioObligatorioPage from './pages/CambioObligatorioPage.jsx';
import ConfiguracionPage from './pages/ConfiguracionPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RecuperarPage from './pages/RecuperarPage.jsx';
import RestablecerPage from './pages/RestablecerPage.jsx';
import EntityPage from './pages/EntityPage.jsx';
import ReportesPage from './pages/ReportesPage.jsx';
import RolHomePage from './pages/RolHomePage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import EstudianteInicioPage from './pages/estudiante/EstudianteInicioPage.jsx';
import MiHistorialPage from './pages/estudiante/MiHistorialPage.jsx';
import MiPerfilPage from './pages/estudiante/MiPerfilPage.jsx';
import MisCalificacionesPage from './pages/estudiante/MisCalificacionesPage.jsx';
import MisMateriasPage from './pages/estudiante/MisMateriasPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route path="/recuperar" element={<PublicOnly><RecuperarPage /></PublicOnly>} />
      <Route path="/cambiar-password" element={<CambioObligatorioPage />} />
      <Route path="/restablecer" element={<RestablecerPage />} />

      <Route
        element={
          <RequireAuth>
            <RequireRole role="administrador">
              <AppLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="/inicio" element={<DashboardPage />} />
        <Route path="/alumnos" element={<UsersPage />} />
        <Route path="/inscripciones" element={<EntityPage key="inscripciones" entity="inscripciones" />} />
        <Route path="/materias" element={<EntityPage key="materias" entity="materias" />} />
        <Route path="/calificaciones" element={<EntityPage key="calificaciones" entity="calificaciones" />} />
        <Route path="/periodos" element={<EntityPage key="periodos" entity="periodos" />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/carreras" element={<EntityPage key="carreras" entity="carreras" />} />
        <Route path="/docentes" element={<EntityPage key="docentes" entity="docentes" />} />
        <Route path="/usuarios" element={<EntityPage key="usuarios" entity="usuarios" />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
      </Route>

      <Route
        path="/docente/inicio"
        element={
          <RequireAuth>
            <RequireRole role="docente">
              <RolHomePage rol="docente" />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireRole role="estudiante">
              <EstudianteLayout />
            </RequireRole>
          </RequireAuth>
        }
      >
        <Route path="/estudiante/inicio" element={<EstudianteInicioPage />} />
        <Route path="/estudiante/materias" element={<MisMateriasPage />} />
        <Route path="/estudiante/calificaciones" element={<MisCalificacionesPage />} />
        <Route path="/estudiante/historial" element={<MiHistorialPage />} />
        <Route path="/estudiante/perfil" element={<MiPerfilPage />} />
      </Route>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

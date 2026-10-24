import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import { PublicOnly, RequireAuth } from './components/layout/RouteGuards.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import UsersPage from './pages/UsersPage.jsx';

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

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/inicio" element={<DashboardPage />} />
        <Route path="/alumnos" element={<UsersPage />} />
        <Route path="/materias" element={<PlaceholderPage title="Materias" />} />
        <Route path="/calificaciones" element={<PlaceholderPage title="Calificaciones" />} />
        <Route path="/reportes" element={<PlaceholderPage title="Reportes" />} />
        <Route path="/configuracion" element={<PlaceholderPage title="Configuración" />} />
      </Route>

      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}

import { Award, BookOpen, History, Home, User } from 'lucide-react';

// Menu del estudiante (mismo orden que el diseño de Figma).
export const NAV_ESTUDIANTE = [
  { to: '/estudiante/inicio', label: 'Inicio', icon: Home },
  { to: '/estudiante/materias', label: 'Mis materias', icon: BookOpen },
  { to: '/estudiante/calificaciones', label: 'Mis calificaciones', icon: Award },
  { to: '/estudiante/historial', label: 'Mi historial', icon: History },
  { to: '/estudiante/perfil', label: 'Mi perfil', icon: User },
];

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Book, Calendar, FileText, Briefcase, Settings, Clock, ClipboardList, FileSignature, BarChart, Shield, CalendarOff, Building, BookOpen, Palette, FlaskConical, School, BookCopy, Users, BookCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';

const teacherNavItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio', featureKey: null },
  { to: '/dashboard/cursos', icon: Book, label: 'Mis Cursos', featureKey: null },
  { to: '/dashboard/horario', icon: Clock, label: 'Horario', featureKey: null },
  { to: '/dashboard/planificacion', icon: Calendar, label: 'Planificación', featureKey: 'planning' },
  { to: '/dashboard/evaluacion', icon: FileText, label: 'Evaluación', featureKey: 'evaluation' },
  { to: '/dashboard/rubricas', icon: FileSignature, label: 'Rúbricas', featureKey: 'rubrics' },
  { to: '/dashboard/proyectos', icon: Briefcase, label: 'Proyectos', featureKey: 'projects' },
  { to: '/dashboard/analiticas', icon: BarChart, label: 'Analíticas', featureKey: 'analytics' },
  { to: '/dashboard/informes', icon: ClipboardList, label: 'Informes', featureKey: 'reports' },
  { to: '/dashboard/bitacora', icon: BookOpen, label: 'Bitácora', featureKey: 'logbook' },
  { to: '/dashboard/classbook', icon: BookCopy, label: 'Libro de Clases', featureKey: 'classbook' },
];

const studentNavItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard/cursos', icon: Book, label: 'Mis Cursos' },
  { to: '/dashboard/mi-horario', icon: Clock, label: 'Horario' },
  { to: '/dashboard/evaluacion', icon: FileText, label: 'Mis Evaluaciones' },
  { to: '/dashboard/mi-progreso', icon: BarChart, label: 'Mi Progreso' },
  { to: '/dashboard/proyectos', icon: Briefcase, label: 'Mis Proyectos' },
];

const adminNavItems = [
  { to: '/dashboard/gestion/cursos', icon: Book, label: 'Cursos' },
  { to: '/dashboard/gestion/calendario', icon: CalendarOff, label: 'Calendario Escolar' },
];

const superAdminNavItems = [
    { to: '/dashboard', icon: Home, label: 'Inicio' },
    { to: '/dashboard/super-admin/establishments', icon: Building, label: 'Establecimientos' },
    { to: '/dashboard/super-admin/users', icon: Users, label: 'Usuarios Globales' },
    { to: '/dashboard/super-admin/curriculum', icon: BookCheck, label: 'Currículum Base' },
    { to: '/dashboard/super-admin/design', icon: Palette, label: 'Diseño' },
    { to: '/dashboard/super-admin/ai-tools', icon: FlaskConical, label: 'Herramientas IA' },
];

interface NavLinksProps {
  onLinkClick?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ onLinkClick }) => {
  const { profile } = useAuth();
  const { features } = useEstablishment();

  if (!profile) return null;

  const isSuperAdmin = profile.rol === 'super_administrador';
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  const isStudent = profile.rol === 'estudiante';

  let navItems;
  if (isSuperAdmin) {
    navItems = superAdminNavItems;
  } else if (isStudent) {
    navItems = studentNavItems;
  } else {
    navItems = teacherNavItems.filter(item => !item.featureKey || features.includes(item.featureKey));
  }

  return (
    <>
      <nav className="flex-1 space-y-2" data-tour="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={onLinkClick}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-muted-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
                isActive && 'bg-primary text-primary-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
        {isAdmin && !isSuperAdmin && (
          <>
            <div className="px-4 pt-6 pb-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                <Shield className="w-4 h-4 mr-2" /> Gestión
              </h2>
            </div>
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center px-4 py-3 text-muted-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
                    isActive && 'bg-primary text-primary-foreground'
                  )
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="mt-auto">
        <NavLink
          to="/dashboard/configuracion"
          data-tour="settings-link"
          onClick={onLinkClick}
          className={({ isActive }) =>
            cn(
              'flex items-center px-4 py-3 text-muted-foreground rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700',
              isActive && 'bg-primary text-primary-foreground'
            )
          }
        >
          <Settings className="w-5 h-5 mr-3" />
          Configuración
        </NavLink>
      </div>
    </>
  );
};

export default NavLinks;
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Book, Calendar, FileText, Briefcase, Settings, Clock, ClipboardList, FileSignature } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Inicio' },
  { to: '/dashboard/cursos', icon: Book, label: 'Mis Cursos' },
  { to: '/dashboard/horario', icon: Clock, label: 'Horario' },
  { to: '/dashboard/planificacion', icon: Calendar, label: 'Planificación' },
  { to: '/dashboard/evaluacion', icon: FileText, label: 'Evaluación' },
  { to: '/dashboard/rubricas', icon: FileSignature, label: 'Rúbricas' },
  { to: '/dashboard/proyectos', icon: Briefcase, label: 'Proyectos' },
  { to: '/dashboard/bitacora', icon: ClipboardList, label: 'Bitácora' },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
      <div className="h-16 flex items-center justify-center border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary">NexusAula</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
                isActive ? 'bg-primary text-white dark:bg-primary dark:text-white' : ''
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-6 border-t dark:border-gray-700">
        <NavLink
          to="/dashboard/configuracion"
          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configuración
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
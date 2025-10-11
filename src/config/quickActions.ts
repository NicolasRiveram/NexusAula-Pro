import { PlusCircle, UserPlus, Book, Clock, Calendar, FileText, Briefcase, BarChart, ClipboardList, BookOpen, FileSignature } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
  { id: 'new_plan', label: 'Nueva Planificación', icon: PlusCircle, path: '/dashboard/planificacion/nueva' },
  { id: 'new_evaluation', label: 'Nueva Evaluación', icon: PlusCircle, path: '/dashboard/evaluacion/crear' },
  { id: 'new_rubric', label: 'Nueva Rúbrica', icon: PlusCircle, path: '/dashboard/rubricas/crear' },
  { id: 'manage_courses', label: 'Gestionar Cursos', icon: UserPlus, path: '/dashboard/cursos' },
  { id: 'view_schedule', label: 'Ver Horario', icon: Clock, path: '/dashboard/horario' },
  { id: 'view_planner', label: 'Ver Planificador', icon: Calendar, path: '/dashboard/planificacion' },
  { id: 'view_evaluations', label: 'Ver Evaluaciones', icon: FileText, path: '/dashboard/evaluacion' },
  { id: 'view_rubrics', label: 'Ver Rúbricas', icon: FileSignature, path: '/dashboard/rubricas' },
  { id: 'view_projects', label: 'Ver Proyectos', icon: Briefcase, path: '/dashboard/proyectos' },
  { id: 'view_analytics', label: 'Ver Analíticas', icon: BarChart, path: '/dashboard/analiticas' },
  { id: 'view_reports', label: 'Ver Informes', icon: ClipboardList, path: '/dashboard/informes' },
  { id: 'view_logbook', label: 'Ver Bitácora', icon: BookOpen, path: '/dashboard/bitacora' },
];
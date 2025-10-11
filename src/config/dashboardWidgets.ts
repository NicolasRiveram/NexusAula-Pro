export interface DashboardWidgetConfig {
  id: string;
  title: string;
  description: string;
}

export const ALL_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'agenda', title: 'Agenda del Día', description: 'Tus clases y evaluaciones para la fecha seleccionada.' },
  { id: 'calendario', title: 'Calendario', description: 'Navega por los días y visualiza eventos importantes.' },
  { id: 'acciones_rapidas', title: 'Accesos Directos', description: 'Botones para tus acciones más frecuentes.' },
  { id: 'notificaciones', title: 'Notificaciones', description: 'Alertas sobre evaluaciones próximas y otros eventos.' },
  { id: 'estadisticas', title: 'Estadísticas Clave', description: 'Gráfico de rendimiento promedio por habilidad.' },
  { id: 'estudiantes_apoyo', title: 'Estudiantes que Requieren Apoyo', description: 'Identifica rápidamente a los estudiantes con menor rendimiento.' },
  { id: 'proyectos_activos', title: 'Proyectos Activos', description: 'Un resumen de tus proyectos ABP en curso.' },
  { id: 'bitacoras_pendientes', title: 'Bitácoras Pendientes', description: 'Un recordatorio de las clases pasadas sin registro.' },
  { id: 'evaluaciones_recientes', title: 'Evaluaciones Recientes', description: 'Acceso rápido a los resultados de tus últimas evaluaciones.' },
  { id: 'anuncios', title: 'Anuncios del Establecimiento', description: 'Mantente al día con las noticias de tu comunidad escolar.' },
];
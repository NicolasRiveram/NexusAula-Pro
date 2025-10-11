import React from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';

interface TeacherTourProps {
  run: boolean;
  onTourEnd: () => void;
}

const TeacherTour: React.FC<TeacherTourProps> = ({ run, onTourEnd }) => {
  const steps: Step[] = [
    {
      target: 'body',
      content: '¡Bienvenido/a a NexusAula! Permítenos mostrarte rápidamente las funciones principales.',
      placement: 'center',
      title: 'Paso 1: Bienvenida',
    },
    {
      target: '[data-tour="establishment-selector"]',
      content: 'Aquí puedes cambiar entre los establecimientos a los que perteneces. La información que veas en el panel dependerá del que tengas activo.',
      title: 'Paso 2: Selector de Establecimiento',
    },
    {
      target: '[data-tour="sidebar-nav"]',
      content: 'Este es tu menú de navegación principal. Desde aquí accedes a todas las herramientas de la plataforma.',
      title: 'Paso 3: Navegación Principal',
    },
    {
      target: 'a[href="/dashboard/planificacion"]',
      content: 'En "Planificación", podrás crear unidades completas con ayuda de la IA, desde los objetivos hasta la secuencia de clases.',
      title: 'Paso 4: Planificador Didáctico',
    },
    {
      target: 'a[href="/dashboard/evaluacion"]',
      content: 'La sección "Evaluación" es tu centro para crear, gestionar e imprimir pruebas y guías, también con asistencia de IA.',
      title: 'Paso 5: Banco de Evaluaciones',
    },
    {
      target: 'a[href="/dashboard/analiticas"]',
      content: 'En "Analíticas", podrás visualizar el rendimiento de tus estudiantes, identificar fortalezas y áreas de mejora.',
      title: 'Paso 6: Analíticas',
    },
    {
      target: '[data-tour="main-content"]',
      content: 'De vuelta al inicio, este es tu panel principal. Aquí verás tu agenda del día, notificaciones y estadísticas de un vistazo.',
      title: 'Paso 7: Tu Panel de Inicio',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'Usa estos botones para acceder rápidamente a las funciones más comunes, como crear una nueva planificación o evaluación.',
      title: 'Paso 8: Accesos Directos',
    },
    {
      target: '[data-tour="settings-link"]',
      content: 'Finalmente, en "Configuración" puedes personalizar tu perfil, tus accesos directos y más. ¡Eso es todo! Ya puedes empezar a explorar.',
      title: 'Paso 9: Configuración',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      onTourEnd();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: 'var(--radius)',
        },
        buttonNext: {
          borderRadius: 'calc(var(--radius) - 4px)',
        },
        buttonBack: {
          borderRadius: 'calc(var(--radius) - 4px)',
        },
      }}
    />
  );
};

export default TeacherTour;
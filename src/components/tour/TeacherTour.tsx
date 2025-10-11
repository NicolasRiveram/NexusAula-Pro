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
      title: 'Bienvenida',
    },
    {
      target: '[data-tour="establishment-selector"]',
      content: 'Aquí puedes cambiar entre los establecimientos a los que perteneces. La información que veas en el panel dependerá del que tengas activo.',
      title: 'Selector de Establecimiento',
    },
    {
      target: '[data-tour="sidebar-nav"]',
      content: 'Este es tu menú de navegación principal. Desde aquí puedes acceder a todas las herramientas de la plataforma.',
      title: 'Navegación Principal',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: 'Estos son tus accesos directos. Una forma rápida de empezar a crear planificaciones, evaluaciones o gestionar tus cursos.',
      title: 'Accesos Directos',
    },
    {
      target: '[data-tour="main-content"]',
      content: 'Este es tu panel de inicio. Aquí verás tu agenda del día, notificaciones importantes y estadísticas clave de un vistazo.',
      title: 'Tu Panel de Inicio',
    },
    {
      target: '[data-tour="settings-link"]',
      content: 'Finalmente, aquí puedes acceder a la configuración de tu perfil y otras preferencias. ¡Eso es todo! Ya puedes empezar a explorar.',
      title: 'Configuración',
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
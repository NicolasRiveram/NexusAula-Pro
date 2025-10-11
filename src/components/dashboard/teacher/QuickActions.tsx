import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" data-tour="quick-actions">
      <Button asChild size="lg" className="h-20 text-lg">
        <Link to="/dashboard/planificacion/nueva">
          <PlusCircle className="mr-2" /> Nueva Planificación
        </Link>
      </Button>
      <Button asChild size="lg" className="h-20 text-lg">
        <Link to="/dashboard/evaluacion/crear">
          <PlusCircle className="mr-2" /> Nueva Evaluación
        </Link>
      </Button>
      <Button asChild size="lg" className="h-20 text-lg">
        <Link to="/dashboard/cursos">
          <UserPlus className="mr-2" /> Gestionar Cursos
        </Link>
      </Button>
    </div>
  );
};

export default QuickActions;
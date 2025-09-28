import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos Directos</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button asChild size="lg" className="h-20 text-lg">
          <Link to="/dashboard/planificacion/nueva">
            <PlusCircle className="mr-2" /> Nueva Planificación
          </Link>
        </Button>
        <Button asChild size="lg" className="h-20 text-lg">
          <Link to="/dashboard/evaluacion/nueva">
            <PlusCircle className="mr-2" /> Nueva Evaluación
          </Link>
        </Button>
        <Button asChild size="lg" className="h-20 text-lg">
          <Link to="/dashboard/cursos/inscribir">
            <UserPlus className="mr-2" /> Inscribir Estudiantes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
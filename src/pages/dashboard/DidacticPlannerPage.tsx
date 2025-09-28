import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const DidacticPlannerPage = () => {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Planificador Didáctico</h1>
          <p className="text-muted-foreground">Crea, visualiza y gestiona tus unidades de planificación.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/planificacion/nueva">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Plan de Unidad
          </Link>
        </Button>
      </div>

      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">Banco de Planes de Unidad</h3>
        <p className="text-muted-foreground mt-2">
          Aquí aparecerán todas tus planificaciones guardadas.
        </p>
        {/* Aquí se listarán las planificaciones existentes en el futuro */}
      </div>
    </div>
  );
};

export default DidacticPlannerPage;
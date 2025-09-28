import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const UnitPlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/planificacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Planificador
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Detalle del Plan de Unidad (ID: {planId})</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Aquí se mostrarán todos los detalles de la planificación, incluyendo la secuencia de clases, objetivos y el proyecto ABP asociado.</p>
          <p className="font-semibold mt-4 text-center text-muted-foreground">
            Esta funcionalidad se implementará a continuación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitPlanDetailPage;
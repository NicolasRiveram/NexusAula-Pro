import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EvaluationPage = () => {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Evaluación</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Desde aquí podrás crear nuevas evaluaciones, calificar las entregas de los estudiantes y analizar los resultados para tomar decisiones pedagógicas.</p>
          {/* El contenido detallado de esta página se implementará a continuación. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationPage;
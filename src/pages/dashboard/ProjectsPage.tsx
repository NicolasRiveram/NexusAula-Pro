import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProjectsPage = () => {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Gestiona proyectos de Aprendizaje Basado en Proyectos (ABP). Define etapas, asigna tareas y sigue el progreso de los equipos de estudiantes.</p>
          {/* El contenido detallado de esta página se implementará a continuación. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectsPage;
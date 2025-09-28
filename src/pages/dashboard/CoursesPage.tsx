import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CoursesPage = () => {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mis Cursos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Aquí se mostrará la lista de cursos que impartes. Podrás gestionar estudiantes, ver el progreso y acceder a los materiales de cada curso.</p>
          {/* El contenido detallado de esta página se implementará a continuación. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CoursesPage;
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const StudentDetailPage = () => {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <div className="container mx-auto space-y-6">
       <Link to="/dashboard/cursos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mis Cursos
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Perfil del Estudiante</CardTitle>
        </CardHeader>
        <CardContent>
          <p>ID del Estudiante: {studentId}</p>
          <p className="mt-4">Esta página mostrará el perfil completo del estudiante, incluyendo sus calificaciones, asistencia, gráficos de rendimiento y habilidades practicadas en tu asignatura.</p>
          <p className="font-semibold mt-2">Esta funcionalidad se implementará a continuación.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDetailPage;
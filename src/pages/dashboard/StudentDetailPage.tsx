import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Mail, User, Hash } from 'lucide-react';
import { fetchStudentProfile, Estudiante } from '@/api/coursesApi';
import { showError } from '@/utils/toast';

const StudentDetailPage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<Estudiante | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      setLoading(true);
      fetchStudentProfile(studentId)
        .then(setStudent)
        .catch(err => showError(`Error al cargar perfil: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [studentId]);

  if (loading) {
    return <div className="container mx-auto"><p>Cargando perfil del estudiante...</p></div>;
  }

  if (!student) {
    return <div className="container mx-auto"><p>No se pudo encontrar al estudiante.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
       <Link to="/dashboard/cursos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Mis Cursos
      </Link>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{student.nombre_completo}</CardTitle>
          <CardDescription>Perfil del Estudiante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center">
              <User className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Nombre:</span>
              <span className="ml-2">{student.nombre_completo}</span>
            </div>
            <div className="flex items-center">
              <Hash className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">RUT:</span>
              <span className="ml-2">{student.rut || 'No especificado'}</span>
            </div>
            <div className="flex items-center">
              <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span className="ml-2">{student.email || 'No especificado'}</span>
            </div>
          </div>
          <p className="font-semibold mt-8 text-center text-muted-foreground">
            Las funcionalidades de rendimiento y asistencia se implementarán a continuación.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDetailPage;
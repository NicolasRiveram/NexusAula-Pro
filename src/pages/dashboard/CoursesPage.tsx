import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookUp } from 'lucide-react';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import CreateCourseDialog from '@/components/courses/CreateCourseDialog';
import AssignSubjectDialog from '@/components/courses/AssignSubjectDialog';
import { showError } from '@/utils/toast';

const CoursesPage = () => {
  const [cursos, setCursos] = useState<CursoAsignatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const loadCourses = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const data = await fetchCursosAsignaturasDocente(user.id);
        setCursos(data);
      } catch (error: any) {
        showError(`Error al cargar cursos: ${error.message}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="text-muted-foreground">Gestiona tus cursos, asignaturas y estudiantes.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)} disabled={!activeEstablishment}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Curso
          </Button>
          <Button onClick={() => setAssignDialogOpen(true)} variant="outline" disabled={!activeEstablishment}>
            <BookUp className="mr-2 h-4 w-4" /> Asignar Asignatura
          </Button>
        </div>
      </div>

      {loading ? (
        <p>Cargando cursos...</p>
      ) : cursos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.map((cursoAsignatura) => (
            <Link to={`/dashboard/cursos/${cursoAsignatura.id}`} key={cursoAsignatura.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{cursoAsignatura.curso.nivel.nombre} {cursoAsignatura.curso.nombre}</CardTitle>
                  <CardDescription>{cursoAsignatura.asignatura.nombre} - {cursoAsignatura.curso.anio}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Aquí se pueden agregar más detalles como el número de estudiantes */}
                  <p className="text-sm text-muted-foreground">Ver detalles del curso y estudiantes.</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No tienes cursos asignados</h3>
          <p className="text-muted-foreground mt-2">
            Crea un nuevo curso o solicita que te asignen una asignatura a un curso existente.
          </p>
        </div>
      )}

      <CreateCourseDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCourseCreated={loadCourses}
      />
      <AssignSubjectDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        onSubjectAssigned={loadCourses}
      />
    </div>
  );
};

export default CoursesPage;
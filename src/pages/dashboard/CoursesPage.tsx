import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import CreateCourseDialog from '@/components/courses/CreateCourseDialog';
import AssignSubjectDialog from '@/components/courses/AssignSubjectDialog';
import { showError } from '@/utils/toast';

const CoursesPage = () => {
  const [groupedCursos, setGroupedCursos] = useState<Record<string, CursoAsignatura[]>>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const loadCourses = async () => {
    if (!activeEstablishment) {
      setGroupedCursos({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const data = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
        
        const groups = data.reduce((acc, curso) => {
          const nivelNombre = curso.curso.nivel.nombre;
          if (!acc[nivelNombre]) {
            acc[nivelNombre] = [];
          }
          acc[nivelNombre].push(curso);
          return acc;
        }, {} as Record<string, CursoAsignatura[]>);

        setGroupedCursos(groups);
      } catch (error: any) {
        showError(`Error al cargar cursos: ${error.message}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, [activeEstablishment]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="text-muted-foreground">Gestiona tus cursos, asignaturas y estudiantes del establecimiento activo.</p>
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
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">
            Por favor, elige un establecimiento en la cabecera para ver tus cursos.
          </p>
        </div>
      ) : Object.keys(groupedCursos).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedCursos).map(([nivelNombre, cursosEnNivel]) => (
            <div key={nivelNombre}>
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{nivelNombre}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosEnNivel.map((cursoAsignatura) => {
                  const isDataIncomplete = 
                    cursoAsignatura.asignatura.nombre === 'Asignatura no asignada' ||
                    cursoAsignatura.curso.nivel.nombre === 'Nivel no asignado' ||
                    cursoAsignatura.curso.nombre === 'Curso sin nombre';

                  return (
                    <Link to={`/dashboard/cursos/${cursoAsignatura.id}`} key={cursoAsignatura.id}>
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{cursoAsignatura.curso.nombre}</CardTitle>
                              <CardDescription>{cursoAsignatura.asignatura.nombre} - {cursoAsignatura.curso.anio}</CardDescription>
                            </div>
                            {isDataIncomplete && (
                              <Badge variant="destructive">Incompleto</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">
                            {isDataIncomplete 
                              ? 'Falta información. Haz clic para revisar.' 
                              : 'Ver detalles del curso y estudiantes.'}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No hay cursos para mostrar</h3>
          <p className="text-muted-foreground mt-2">
            No tienes asignaturas asignadas a cursos en este establecimiento.
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
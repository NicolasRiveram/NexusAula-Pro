import React, { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, BookUp, MoreVertical, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchCursosAsignaturasDocente, fetchEstudiantesPorCurso, CursoAsignatura } from '@/api/coursesApi';
import { fetchStudentCourses, StudentCourse } from '@/api/studentApi';
import CreateCourseDialog from '@/components/courses/CreateCourseDialog';
import AssignSubjectDialog from '@/components/courses/AssignSubjectDialog';
import EnrollStudentsDialog from '@/components/courses/EnrollStudentsDialog';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardContext {
  profile: { 
    rol: string;
    subscription_plan?: string;
  };
}

const CoursesPage = () => {
  const { profile } = useOutletContext<DashboardContext>();
  const { user } = useAuth();
  const isStudent = profile.rol === 'estudiante';
  const isTrial = profile.subscription_plan === 'prueba';

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; nombre: string } | null>(null);
  const { activeEstablishment } = useEstablishment();

  const { data: coursesData, isLoading: loading, refetch: loadCourses } = useQuery({
    queryKey: ['courses', user?.id, activeEstablishment?.id, isStudent],
    queryFn: async () => {
      if (!user || !activeEstablishment) return isStudent ? [] : {};
      if (isStudent) {
        return await fetchStudentCourses(user.id, activeEstablishment.id);
      } else {
        const data = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
        return data.reduce((acc, curso) => {
          const nivelNombre = curso.curso.nivel.nombre;
          if (!acc[nivelNombre]) acc[nivelNombre] = [];
          acc[nivelNombre].push(curso);
          return acc;
        }, {} as Record<string, CursoAsignatura[]>);
      }
    },
    enabled: !!user && !!activeEstablishment,
  });

  const teacherCourses = !isStudent ? (coursesData as Record<string, CursoAsignatura[]>) || {} : {};
  const studentCourses = isStudent ? (coursesData as StudentCourse[]) || [] : [];

  const teacherCoursesCount = useMemo(() => {
    return Object.values(teacherCourses).flat().length;
  }, [teacherCourses]);

  const canCreateCourse = !isTrial || (isTrial && teacherCoursesCount < 2);

  const handleEnrollClick = (curso: CursoAsignatura) => {
    setSelectedCourse({ id: curso.curso.id, nombre: `${curso.curso.nivel.nombre} ${curso.curso.nombre}` });
    setEnrollDialogOpen(true);
  };

  const handleDownloadCredentials = async (cursoAsignatura: CursoAsignatura) => {
    const toastId = showLoading("Generando credenciales...");
    try {
        const estudiantes = await fetchEstudiantesPorCurso(cursoAsignatura.curso.id);

        if (estudiantes.length === 0) {
            dismissToast(toastId);
            showError("No hay estudiantes en este curso para generar credenciales.");
            return;
        }

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(`Credenciales de Acceso - ${cursoAsignatura.curso.nivel.nombre} ${cursoAsignatura.curso.nombre}`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text("A continuación se listan los datos de acceso para los estudiantes.", 14, 30);
        doc.text("La contraseña temporal es el RUT del estudiante, sin puntos ni guion.", 14, 36);

        const tableData = estudiantes.map(est => [
            est.nombre_completo,
            est.email || 'No asignado',
            est.rut ? est.rut.replace(/[.-]/g, '') : 'SIN RUT',
        ]);

        autoTable(doc, {
            startY: 45,
            head: [['Nombre Completo', 'Email de Acceso', 'Contraseña Temporal']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [34, 49, 63] },
        });

        doc.save(`credenciales-${cursoAsignatura.curso.nivel.nombre}-${cursoAsignatura.curso.nombre}.pdf`);
        dismissToast(toastId);

    } catch (error: any) {
        dismissToast(toastId);
        showError(`Error al generar el PDF: ${error.message}`);
    }
  };

  const renderStudentView = () => (
    <>
      <div>
        <h1 className="text-3xl font-bold">Mis Asignaturas</h1>
        <p className="text-muted-foreground">Aquí puedes ver todas las asignaturas en las que estás inscrito.</p>
      </div>
      {studentCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentCourses.map(course => (
            <Link to={`/dashboard/cursos/${course.id}`} key={course.id} className="block h-full">
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                  <CardTitle>{course.asignatura_nombre}</CardTitle>
                  <CardDescription>{course.nivel_nombre} {course.curso_nombre}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Docente: {course.docente_nombre || 'No asignado'}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No estás inscrito en ninguna asignatura</h3>
          <p className="text-muted-foreground mt-2">
            Contacta al administrador de tu establecimiento para que te inscriba en tus cursos.
          </p>
        </div>
      )}
    </>
  );

  const renderTeacherView = () => (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mis Cursos</h1>
          <p className="text-muted-foreground">Gestiona tus cursos, asignaturas y estudiantes del establecimiento activo.</p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button onClick={() => setCreateDialogOpen(true)} disabled={!activeEstablishment || !canCreateCourse}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Curso
                  </Button>
                </div>
              </TooltipTrigger>
              {!canCreateCourse && (
                <TooltipContent>
                  <p>Has alcanzado el límite de 2 cursos del plan de prueba.</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
          <Button onClick={() => setAssignDialogOpen(true)} variant="outline" disabled={!activeEstablishment}>
            <BookUp className="mr-2 h-4 w-4" /> Asignar Asignatura
          </Button>
        </div>
      </div>
      {Object.keys(teacherCourses).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(teacherCourses).map(([nivelNombre, cursosEnNivel]) => (
            <div key={nivelNombre}>
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{nivelNombre}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosEnNivel.map((cursoAsignatura) => (
                  <div className="relative group" key={cursoAsignatura.id}>
                    <Link to={`/dashboard/cursos/${cursoAsignatura.id}`} className="block h-full">
                      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{cursoAsignatura.curso.nombre}</CardTitle>
                              <CardDescription>{cursoAsignatura.asignatura.nombre} - {cursoAsignatura.curso.anio}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <p className="text-sm text-muted-foreground">Ver detalles del curso y estudiantes.</p>
                        </CardContent>
                      </Card>
                    </Link>
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleEnrollClick(cursoAsignatura); }}>
                            Inscribir Estudiantes
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDownloadCredentials(cursoAsignatura); }}>
                            Descargar Credenciales
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
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
    </>
  );

  return (
    <div className="container mx-auto space-y-6">
      {loading ? (
        <p>Cargando cursos...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">
            Por favor, elige un establecimiento en la cabecera para ver tus cursos.
          </p>
        </div>
      ) : isStudent ? renderStudentView() : renderTeacherView()}

      {!isStudent && (
        <>
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
          <EnrollStudentsDialog
            isOpen={isEnrollDialogOpen}
            onClose={() => setEnrollDialogOpen(false)}
            cursoId={selectedCourse?.id || ''}
            cursoNombre={selectedCourse?.nombre || ''}
            onStudentsEnrolled={() => {
              setEnrollDialogOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CoursesPage;
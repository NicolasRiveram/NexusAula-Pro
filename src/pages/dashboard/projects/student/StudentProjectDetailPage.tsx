import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Book, Calendar, Target } from 'lucide-react';
import { fetchProjectDetails, ProjectDetail } from '@/api/projectsApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

const StudentProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isLoading: loading } = useQuery({
    queryKey: ['projectDetails', projectId],
    queryFn: () => fetchProjectDetails(projectId!),
    enabled: !!projectId,
    onError: (err: any) => showError(`Error al cargar el proyecto: ${err.message}`),
  });

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!project) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo encontrar el proyecto.</p>
        <Link to="/dashboard/proyectos" className="text-primary hover:underline mt-4 inline-block">Volver a Proyectos</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/proyectos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proyectos
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{project.nombre}</CardTitle>
          <CardDescription>Creado por: {project.perfiles.nombre_completo}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{project.descripcion}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> <span>{format(parseISO(project.fecha_inicio), "d LLL", { locale: es })} - {format(parseISO(project.fecha_fin), "d LLL, yyyy", { locale: es })}</span></div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Producto Final:</h3>
            <p className="text-muted-foreground">{project.producto_final}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-lg flex items-center"><Book className="mr-2 h-5 w-5" /> Cursos y Asignaturas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {project.proyecto_curso_asignaturas.map(link => (
              <div key={link.curso_asignaturas.id} className="p-1">
                <p className="font-semibold text-sm">{link.curso_asignaturas.asignaturas.nombre}</p>
                <p className="text-xs text-muted-foreground">{link.curso_asignaturas.cursos.niveles.nombre} {link.curso_asignaturas.cursos.nombre}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-lg">Etapas del Proyecto</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {project.proyecto_etapas.length > 0 ? project.proyecto_etapas.map(etapa => (
              <div key={etapa.id} className="flex items-start gap-4">
                <Checkbox checked={etapa.completada} disabled className="mt-1" />
                <div className="flex-1">
                  <p className="font-semibold">{etapa.nombre}</p>
                  <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                  {etapa.fecha_inicio && etapa.fecha_fin && <p className="text-xs text-muted-foreground mt-1">{format(parseISO(etapa.fecha_inicio), 'P', { locale: es })} - {format(parseISO(etapa.fecha_fin), 'P', { locale: es })}</p>}
                </div>
              </div>
            )) : <p className="text-muted-foreground text-center">No se han definido etapas para este proyecto.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentProjectDetailPage;
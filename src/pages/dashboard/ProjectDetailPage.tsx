import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Book, Calendar, CheckCircle, Circle, UserPlus, LogOut } from 'lucide-react';
import { fetchProjectDetails, ProjectDetail, unlinkCourseFromProject } from '@/api/projectsApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import JoinProjectDialog from '@/components/projects/JoinProjectDialog';

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);
    };
    getUserId();
  }, []);

  const loadProject = useCallback(async () => {
    if (projectId) {
      setLoading(true);
      fetchProjectDetails(projectId)
        .then(setProject)
        .catch(err => showError(`Error al cargar el proyecto: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const handleUnlink = async (cursoAsignaturaId: string) => {
    if (!projectId || !window.confirm("¿Estás seguro de que quieres desvincular este curso del proyecto?")) return;
    const toastId = showLoading("Desvinculando curso...");
    try {
        await unlinkCourseFromProject(projectId, cursoAsignaturaId);
        dismissToast(toastId);
        showSuccess("Curso desvinculado.");
        loadProject();
    } catch (error: any) {
        dismissToast(toastId);
        showError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo encontrar el proyecto.</p>
        <Link to="/dashboard/proyectos" className="text-primary hover:underline mt-4 inline-block">
          Volver a Proyectos
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/proyectos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Explorar Proyectos
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{project.nombre}</CardTitle>
                <CardDescription>
                  Creado por: {project.creado_por.nombre_completo}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Unirse al Proyecto</Button>
              </div>
            </div>
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
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Book className="mr-2 h-5 w-5" /> Cursos y Asignaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.proyecto_curso_asignaturas.map(link => {
                const isOwner = link.curso_asignaturas.docente_id === currentUserId;
                return (
                  <div key={link.curso_asignaturas.id} className="flex justify-between items-center group p-1 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="font-semibold text-sm">{link.curso_asignaturas.asignaturas.nombre}</p>
                      <p className="text-xs text-muted-foreground">{link.curso_asignaturas.cursos.niveles.nombre} {link.curso_asignaturas.cursos.nombre}</p>
                    </div>
                    {isOwner && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleUnlink(link.curso_asignaturas.id)}>
                            <LogOut className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Etapas del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.proyecto_etapas.length > 0 ? project.proyecto_etapas.map(etapa => (
                <div key={etapa.id} className="flex items-start gap-4">
                  {etapa.completada ? <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> : <Circle className="h-5 w-5 text-muted-foreground mt-1" />}
                  <div>
                    <p className="font-semibold">{etapa.nombre}</p>
                    <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                    {etapa.fecha_inicio && etapa.fecha_fin && (
                      <p className="text-xs text-muted-foreground mt-1">{format(parseISO(etapa.fecha_inicio), 'P', { locale: es })} - {format(parseISO(etapa.fecha_fin), 'P', { locale: es })}</p>
                    )}
                  </div>
                </div>
              )) : <p className="text-muted-foreground text-center">No se han definido etapas para este proyecto.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
      {projectId && (
        <JoinProjectDialog
          isOpen={isJoinDialogOpen}
          onClose={() => setJoinDialogOpen(false)}
          onJoined={loadProject}
          projectId={projectId}
          alreadyLinkedIds={project.proyecto_curso_asignaturas.map(link => link.curso_asignaturas.id)}
        />
      )}
    </>
  );
};

export default ProjectDetailPage;
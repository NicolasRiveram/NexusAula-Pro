import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Book, Calendar, UserPlus, LogOut, Link2, Link2Off, PlusCircle, Edit, Trash2, Target } from 'lucide-react';
import { fetchProjectDetails, ProjectDetail, unlinkCourseFromProject, unlinkUnitFromProject, deleteStage, updateStageStatus, ProjectStage, linkCoursesToProject, linkUnitsToProject, saveStage } from '@/api/projectsApi';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import JoinProjectDialog from '@/components/projects/JoinProjectDialog';
import LinkUnitDialog from '@/components/projects/LinkUnitDialog';
import StageEditDialog from '@/components/projects/StageEditDialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DashboardContext {
  profile: { rol: string };
}

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { profile } = useOutletContext<DashboardContext>();
  const { user } = useAuth();
  const isStudent = profile.rol === 'estudiante';

  const [isJoinDialogOpen, setJoinDialogOpen] = useState(false);
  const [isLinkUnitDialogOpen, setLinkUnitDialogOpen] = useState(false);
  const [isStageDialogOpen, setStageDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);

  const { data: project, isLoading: loading } = useQuery({
    queryKey: ['projectDetails', projectId],
    queryFn: () => fetchProjectDetails(projectId!),
    enabled: !!projectId,
    onError: (err: any) => showError(`Error al cargar el proyecto: ${err.message}`),
  });

  const createMutationOptions = (successMessage: string) => ({
    onSuccess: () => {
      showSuccess(successMessage);
      queryClient.invalidateQueries({ queryKey: ['projectDetails', projectId] });
    },
    onError: (error: any) => showError(error.message),
  });

  const unlinkCourseMutation = useMutation({ mutationFn: (vars: { projectId: string, cursoAsignaturaId: string }) => unlinkCourseFromProject(vars.projectId, vars.cursoAsignaturaId), ...createMutationOptions("Curso desvinculado.") });
  const unlinkUnitMutation = useMutation({ mutationFn: (vars: { projectId: string, unidadId: string }) => unlinkUnitFromProject(vars.projectId, vars.unidadId), ...createMutationOptions("Unidad desvinculada.") });
  const deleteStageMutation = useMutation({ mutationFn: deleteStage, ...createMutationOptions("Etapa eliminada.") });
  const updateStageStatusMutation = useMutation({ mutationFn: (vars: { stageId: string, completada: boolean }) => updateStageStatus(vars.stageId, vars.completada), ...createMutationOptions("Estado de la etapa actualizado.") });
  const joinProjectMutation = useMutation({ mutationFn: (vars: { projectId: string, cursoAsignaturaIds: string[] }) => linkCoursesToProject(vars.projectId, vars.cursoAsignaturaIds), ...createMutationOptions("¡Te has unido al proyecto con tus cursos!") });
  const linkUnitMutation = useMutation({ mutationFn: (vars: { projectId: string, unidadIds: string[] }) => linkUnitsToProject(vars.projectId, vars.unidadIds), ...createMutationOptions("Unidades vinculadas al proyecto.") });
  const saveStageMutation = useMutation({ mutationFn: (vars: { projectId: string, stageData: any, stageId?: string }) => saveStage(vars.projectId, vars.stageData, vars.stageId), ...createMutationOptions("Etapa guardada exitosamente.") });

  const handleUnlinkCourse = (cursoAsignaturaId: string, cursoNombre: string) => {
    setAlertConfig({
      title: `¿Desvincular "${cursoNombre}"?`,
      description: "Esta acción desvinculará el curso de este proyecto, pero no eliminará el curso en sí.",
      onConfirm: () => {
        if (projectId) unlinkCourseMutation.mutate({ projectId, cursoAsignaturaId });
        setAlertOpen(false);
      }
    });
    setAlertOpen(true);
  };

  const handleUnlinkUnit = (unidadId: string, unidadNombre: string) => {
    setAlertConfig({
      title: `¿Desvincular la unidad "${unidadNombre}"?`,
      description: "Esta acción desvinculará la unidad de este proyecto, pero no eliminará la unidad en sí.",
      onConfirm: () => {
        if (projectId) unlinkUnitMutation.mutate({ projectId, unidadId });
        setAlertOpen(false);
      }
    });
    setAlertOpen(true);
  };

  const handleDeleteStage = (stage: ProjectStage) => {
    setAlertConfig({
      title: `¿Eliminar la etapa "${stage.nombre}"?`,
      description: "Esta acción no se puede deshacer y eliminará permanentemente la etapa del proyecto.",
      onConfirm: () => {
        deleteStageMutation.mutate(stage.id);
        setAlertOpen(false);
      }
    });
    setAlertOpen(true);
  };

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

  const isOwner = project.creado_por === user?.id;

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/proyectos" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Proyectos
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{project.nombre}</CardTitle>
                <CardDescription>Creado por: {project.perfiles.nombre_completo}</CardDescription>
              </div>
              {!isStudent && <Button variant="outline" onClick={() => setJoinDialogOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Unirse al Proyecto</Button>}
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
            <CardHeader><CardTitle className="text-lg flex items-center"><Book className="mr-2 h-5 w-5" /> Cursos y Asignaturas</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {project.proyecto_curso_asignaturas.map(link => {
                const isCourseOwner = link.curso_asignaturas.docente_id === user?.id;
                return (
                  <div key={link.curso_asignaturas.id} className="flex justify-between items-center group p-1 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="font-semibold text-sm">{link.curso_asignaturas.asignaturas.nombre}</p>
                      <p className="text-xs text-muted-foreground">{link.curso_asignaturas.cursos.niveles.nombre} {link.curso_asignaturas.cursos.nombre}</p>
                    </div>
                    {isCourseOwner && !isStudent && <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => handleUnlinkCourse(link.curso_asignaturas.id, `${link.curso_asignaturas.cursos.niveles.nombre} ${link.curso_asignaturas.cursos.nombre}`)}><LogOut className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-lg">Etapas del Proyecto</CardTitle>
              {isOwner && !isStudent && <Button size="sm" onClick={() => { setSelectedStage(null); setStageDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Etapa</Button>}
            </CardHeader>
            <CardContent className="space-y-4">
              {project.proyecto_etapas.length > 0 ? project.proyecto_etapas.map(etapa => (
                <div key={etapa.id} className="flex items-start gap-4 group">
                  <Checkbox checked={etapa.completada} onCheckedChange={() => updateStageStatusMutation.mutate({ stageId: etapa.id, completada: !etapa.completada })} disabled={!isOwner || isStudent} className="mt-1" />
                  <div className="flex-1">
                    <p className="font-semibold">{etapa.nombre}</p>
                    <p className="text-sm text-muted-foreground">{etapa.descripcion}</p>
                    {etapa.fecha_inicio && etapa.fecha_fin && <p className="text-xs text-muted-foreground mt-1">{format(parseISO(etapa.fecha_inicio), 'P', { locale: es })} - {format(parseISO(etapa.fecha_fin), 'P', { locale: es })}</p>}
                  </div>
                  {isOwner && !isStudent && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedStage(etapa); setStageDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteStage(etapa)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  )}
                </div>
              )) : <p className="text-muted-foreground text-center">No se han definido etapas para este proyecto.</p>}
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg flex items-center"><Link2 className="mr-2 h-5 w-5" /> Unidades Vinculadas</CardTitle>
                    <CardDescription>Planes de unidad que forman parte de este proyecto.</CardDescription>
                </div>
                {!isStudent && <Button variant="outline" onClick={() => setLinkUnitDialogOpen(true)}>Vincular Unidad</Button>}
            </CardHeader>
            <CardContent>
                {project.proyecto_unidades_link.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {project.proyecto_unidades_link.map(link => (
                            <AccordionItem key={link.unidades.id} value={link.unidades.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between w-full pr-4 items-center">
                                        <div className="text-left">
                                            <p className="font-semibold">{link.unidades.nombre}</p>
                                            <p className="text-sm text-muted-foreground">{link.unidades.curso_asignaturas.cursos.niveles.nombre} {link.unidades.curso_asignaturas.cursos.nombre}</p>
                                        </div>
                                        {isOwner && !isStudent && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleUnlinkUnit(link.unidades.id, link.unidades.nombre); }}><Link2Off className="h-4 w-4 text-destructive" /></Button>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3 p-2">
                                        {link.unidades.planificaciones_clase.length > 0 ? link.unidades.planificaciones_clase.map(clase => (
                                            <div key={clase.id} className="p-3 border rounded-md">
                                                <p className="font-semibold text-sm">{clase.titulo}</p>
                                                <p className="text-xs text-muted-foreground mt-1 flex items-start">
                                                    <Target className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span className="font-medium mr-1">Aporte al Proyecto:</span>
                                                    {clase.aporte_proyecto || 'No especificado.'}
                                                </p>
                                            </div>
                                        )) : <p className="text-sm text-muted-foreground text-center">Esta unidad aún no tiene clases planificadas.</p>}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : <p className="text-muted-foreground text-center py-4">Aún no hay unidades vinculadas a este proyecto.</p>}
            </CardContent>
        </Card>
      </div>
      {projectId && !isStudent && (
        <>
          <JoinProjectDialog isOpen={isJoinDialogOpen} onClose={() => setJoinDialogOpen(false)} onJoin={(ids) => joinProjectMutation.mutate({ projectId, cursoAsignaturaIds: ids })} isJoining={joinProjectMutation.isPending} projectId={projectId} alreadyLinkedIds={project.proyecto_curso_asignaturas.map(link => link.curso_asignaturas.id)} />
          <LinkUnitDialog isOpen={isLinkUnitDialogOpen} onClose={() => setLinkUnitDialogOpen(false)} onLink={(ids) => linkUnitMutation.mutate({ projectId, unidadIds: ids })} isLinking={linkUnitMutation.isPending} projectId={projectId} />
          <StageEditDialog isOpen={isStageDialogOpen} onClose={() => setStageDialogOpen(false)} onSave={(data, id) => saveStageMutation.mutate({ projectId, stageData: data, stageId: id })} isSaving={saveStageMutation.isPending} projectId={projectId} stage={selectedStage} />
        </>
      )}
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={alertConfig?.onConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectDetailPage;
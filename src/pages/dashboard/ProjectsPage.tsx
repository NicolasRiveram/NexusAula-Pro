import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { fetchProjects, Project } from '@/api/projectsApi';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();

  const loadProjects = async () => {
    if (!activeEstablishment) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const data = await fetchProjects(user.id, activeEstablishment.id);
        setProjects(data);
      } catch (err: any) {
        showError(`Error al cargar proyectos: ${err.message}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProjects();
  }, [activeEstablishment]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Proyectos ABP</h1>
          <p className="text-muted-foreground">Gestiona tus proyectos de Aprendizaje Basado en Proyectos.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} disabled={!activeEstablishment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Proyecto
        </Button>
      </div>

      {loading ? (
        <p>Cargando proyectos...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus proyectos.</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.nombre}</CardTitle>
                <CardDescription>
                  {format(parseISO(project.fecha_inicio), "d LLL", { locale: es })} - {format(parseISO(project.fecha_fin), "d LLL, yyyy", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.descripcion}</p>
                  <div>
                    <Badge variant="outline">{project.curso_asignatura.curso.nivel.nombre} {project.curso_asignatura.curso.nombre}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No tienes proyectos</h3>
          <p className="text-muted-foreground mt-2">
            Crea tu primer proyecto ABP para este establecimiento.
          </p>
        </div>
      )}

      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onProjectCreated={loadProjects}
      />
    </div>
  );
};

export default ProjectsPage;
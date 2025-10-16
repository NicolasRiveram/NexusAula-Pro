import React, { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { fetchAllProjects, Project, createProject } from '@/api/projectsApi';
import { fetchNiveles, fetchAsignaturas, Nivel, Asignatura } from '@/api/coursesApi';
import { showError, showSuccess } from '@/utils/toast';
import ProjectCard from '@/components/projects/ProjectCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const TeacherProjectsPage = () => {
  const [selectedNivel, setSelectedNivel] = useState<string>('all');
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('all');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', activeEstablishment?.id, selectedNivel, selectedAsignatura, 'teacher'],
    queryFn: async () => {
      if (!activeEstablishment || !user) return [];
      const nivelFilter = selectedNivel === 'all' ? undefined : selectedNivel;
      const asignaturaFilter = selectedAsignatura === 'all' ? undefined : selectedAsignatura;
      return await fetchAllProjects(activeEstablishment.id, nivelFilter, asignaturaFilter);
    },
    enabled: !!activeEstablishment && !!user,
  });

  const { data: { niveles = [], asignaturas = [] } = {}, isLoading: loadingFilters } = useQuery({
    queryKey: ['projectFilters'],
    queryFn: async () => {
      const [nivelesData, asignaturasData] = await Promise.all([fetchNiveles(), fetchAsignaturas()]);
      return { niveles: nivelesData, asignaturas: asignaturasData };
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      showSuccess("Proyecto creado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      showError(`Error al crear el proyecto: ${error.message}`);
    }
  });

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Explorar Proyectos ABP</h1>
          <p className="text-muted-foreground">Descubre y colabora en los proyectos de tu establecimiento.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedNivel} onValueChange={setSelectedNivel} disabled={loadingFilters}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Nivel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              {niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura} disabled={loadingFilters}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Asignatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las asignaturas</SelectItem>
              {asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateDialogOpen(true)} className="whitespace-nowrap">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Proyecto
          </Button>
        </div>
      </div>

      {loadingProjects ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para explorar proyectos.</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No se encontraron proyectos</h3>
          <p className="text-muted-foreground mt-2">
            Prueba a cambiar los filtros o crea el primer proyecto para este establecimiento.
          </p>
        </div>
      )}
      <CreateProjectDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onProjectCreate={(data) => createProjectMutation.mutate(data)}
        isCreating={createProjectMutation.isPending}
      />
    </>
  );
};

export default TeacherProjectsPage;
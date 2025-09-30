import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { fetchAllProjects, fetchStudentProjects, Project } from '@/api/projectsApi';
import { fetchNiveles, fetchAsignaturas, Nivel, Asignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import ProjectCard from '@/components/projects/ProjectCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';

interface DashboardContext {
  profile: { rol: string } | null;
}

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<string>('all');
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  
  const isStudent = profile?.rol === 'estudiante';

  const loadProjects = async () => {
    if (!activeEstablishment || !profile) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      let data;
      if (isStudent) {
        data = await fetchStudentProjects(user.id, activeEstablishment.id);
      } else {
        const nivelFilter = selectedNivel === 'all' ? undefined : selectedNivel;
        const asignaturaFilter = selectedAsignatura === 'all' ? undefined : selectedAsignatura;
        data = await fetchAllProjects(activeEstablishment.id, nivelFilter, asignaturaFilter);
      }
      setProjects(data);
    } catch (err: any) {
      showError(`Error al cargar proyectos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStudent) {
      const loadFilters = async () => {
        try {
          const [nivelesData, asignaturasData] = await Promise.all([fetchNiveles(), fetchAsignaturas()]);
          setNiveles(nivelesData);
          setAsignaturas(asignaturasData);
        } catch (err: any) {
          showError(`Error al cargar filtros: ${err.message}`);
        }
      };
      loadFilters();
    }
  }, [isStudent]);

  useEffect(() => {
    loadProjects();
  }, [activeEstablishment, selectedNivel, selectedAsignatura, isStudent, profile]);

  if (!profile) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{isStudent ? 'Mis Proyectos' : 'Explorar Proyectos ABP'}</h1>
            <p className="text-muted-foreground">
              {isStudent ? 'Estos son los proyectos en los que participan tus cursos.' : 'Descubre y colabora en los proyectos de tu establecimiento.'}
            </p>
          </div>
          {!isStudent && (
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={selectedNivel} onValueChange={setSelectedNivel}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  {niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura}>
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
          )}
        </div>

        {loading ? (
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
              {isStudent ? 'Aún no participas en ningún proyecto.' : 'Prueba a cambiar los filtros o crea el primer proyecto para este establecimiento.'}
            </p>
          </div>
        )}
      </div>
      {!isStudent && (
        <CreateProjectDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onProjectCreated={loadProjects}
        />
      )}
    </>
  );
};

export default ProjectsPage;
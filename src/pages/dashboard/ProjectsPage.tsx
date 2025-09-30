import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { fetchAllProjects, Project } from '@/api/projectsApi';
import { fetchNiveles, fetchAsignaturas, Nivel, Asignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import ProjectCard from '@/components/projects/ProjectCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProjectsPage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [selectedNivel, setSelectedNivel] = useState<string>('');
  const [selectedAsignatura, setSelectedAsignatura] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      if (!activeEstablishment) {
        setProjects([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await fetchAllProjects(activeEstablishment.id, selectedNivel || undefined, selectedAsignatura || undefined);
        setProjects(data);
      } catch (err: any) {
        showError(`Error al cargar proyectos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [activeEstablishment, selectedNivel, selectedAsignatura]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Explorar Proyectos ABP</h1>
          <p className="text-muted-foreground">Descubre y colabora en los proyectos de tu establecimiento.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={selectedNivel} onValueChange={setSelectedNivel}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Nivel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los niveles</SelectItem>
              {niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedAsignatura} onValueChange={setSelectedAsignatura}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por Asignatura" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las asignaturas</SelectItem>
              {asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
            Prueba a cambiar los filtros o crea el primer proyecto para este establecimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
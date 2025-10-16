import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Loader2 } from 'lucide-react';
import { fetchStudentProjects, Project } from '@/api/projectsApi';
import ProjectCard from '@/components/projects/ProjectCard';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const StudentProjectsPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', activeEstablishment?.id, 'student'],
    queryFn: async () => {
      if (!activeEstablishment || !user) return [];
      return await fetchStudentProjects(user.id, activeEstablishment.id);
    },
    enabled: !!activeEstablishment && !!user,
  });

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold">Mis Proyectos</h1>
        <p className="text-muted-foreground">Estos son los proyectos en los que participan tus cursos.</p>
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
          <p className="text-muted-foreground mt-2">Aún no participas en ningún proyecto.</p>
        </div>
      )}
    </>
  );
};

export default StudentProjectsPage;
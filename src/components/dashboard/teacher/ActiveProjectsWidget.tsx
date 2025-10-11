import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchTeacherActiveProjects } from '@/api/projectsApi';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ActiveProjectsWidget = () => {
  const { activeEstablishment } = useEstablishment();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: async () => (await supabase.auth.getUser()).data.user });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['activeProjects', user?.id, activeEstablishment?.id],
    queryFn: () => fetchTeacherActiveProjects(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>;
  }

  if (!projects || projects.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">No participas en proyectos activos.</p>;
  }

  return (
    <div className="space-y-3">
      {projects.map(project => (
        <Link to={`/dashboard/proyectos/${project.id}`} key={project.id} className="block p-3 rounded-md hover:bg-muted/50 border">
          <div className="flex justify-between items-start">
            <p className="font-semibold text-sm">{project.nombre}</p>
            <Badge variant="secondary">{project.proyecto_etapas.find(e => !e.completada)?.nombre || 'Finalizado'}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(project.fecha_inicio), "d LLL", { locale: es })} - {format(parseISO(project.fecha_fin), "d LLL, yyyy", { locale: es })}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default ActiveProjectsWidget;
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/api/projectsApi';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const uniqueSubjects = Array.from(new Set(project.proyecto_curso_asignaturas.map(link => link.curso_asignaturas.asignaturas.nombre)));

  return (
    <Link to={`/dashboard/proyectos/${project.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>{project.nombre}</CardTitle>
          <CardDescription>
            {format(parseISO(project.fecha_inicio), "d LLL", { locale: es })} - {format(parseISO(project.fecha_fin), "d LLL, yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.descripcion}</p>
          <div className="flex flex-wrap gap-1">
            {uniqueSubjects.slice(0, 3).map(subject => (
              <Badge key={subject} variant="secondary">{subject}</Badge>
            ))}
            {uniqueSubjects.length > 3 && <Badge variant="secondary">+{uniqueSubjects.length - 3} más</Badge>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;
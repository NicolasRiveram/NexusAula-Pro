import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDetallesCursoAsignatura, fetchEstudiantesPorCurso, CursoAsignatura, Estudiante } from '@/api/coursesApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { showError } from '@/utils/toast';

const CourseDetailPage = () => {
  const { cursoAsignaturaId } = useParams<{ cursoAsignaturaId: string }>();
  const [cursoInfo, setCursoInfo] = useState<CursoAsignatura | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cursoAsignaturaId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const info = await fetchDetallesCursoAsignatura(cursoAsignaturaId);
        setCursoInfo(info);
        if (info) {
          const studentsData = await fetchEstudiantesPorCurso(info.curso.id);
          setEstudiantes(studentsData);
        }
      } catch (error: any) {
        showError(`Error al cargar los detalles del curso: ${error.message}`);
      }
      setLoading(false);
    };

    loadData();
  }, [cursoAsignaturaId]);

  if (loading) {
    return <div className="container mx-auto"><p>Cargando detalles del curso...</p></div>;
  }

  if (!cursoInfo) {
    return <div className="container mx-auto"><p>No se pudo encontrar la información del curso.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{cursoInfo.curso.nivel.nombre} {cursoInfo.curso.nombre}</h1>
        <p className="text-xl text-muted-foreground">{cursoInfo.asignatura.nombre} - {cursoInfo.curso.anio}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Estudiantes</CardTitle>
          <CardDescription>
            Listado de todos los estudiantes inscritos en este curso. Haz clic en un estudiante para ver su perfil detallado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Rendimiento General</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {estudiantes.length > 0 ? (
                estudiantes.map((estudiante) => (
                  <TableRow key={estudiante.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link to={`/dashboard/estudiante/${estudiante.id}`} className="hover:underline">
                        {estudiante.nombre_completo}
                      </Link>
                    </TableCell>
                    <TableCell>{estudiante.rut}</TableCell>
                    <TableCell>{estudiante.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">Próximamente</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No hay estudiantes inscritos en este curso.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseDetailPage;
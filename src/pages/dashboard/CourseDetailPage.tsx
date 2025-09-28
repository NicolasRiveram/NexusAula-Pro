import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDetallesCursoAsignatura, fetchEstudiantesPorCurso, CursoAsignatura, Estudiante } from '@/api/coursesApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { showError } from '@/utils/toast';
import EditStudentDialog from '@/components/courses/EditStudentDialog';

const CourseDetailPage = () => {
  const { cursoAsignaturaId } = useParams<{ cursoAsignaturaId: string }>();
  const [cursoInfo, setCursoInfo] = useState<CursoAsignatura | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null);

  const loadData = useCallback(async () => {
    if (!cursoAsignaturaId) return;
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
  }, [cursoAsignaturaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditClick = (estudiante: Estudiante) => {
    setSelectedStudent(estudiante);
    setEditDialogOpen(true);
  };

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
                <TableHead className="text-center">Rendimiento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
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
                    <TableCell>{estudiante.rut || 'No disponible'}</TableCell>
                    <TableCell>{estudiante.email || 'No disponible'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">Próximamente</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(estudiante)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No hay estudiantes inscritos en este curso.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditStudentDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onStudentUpdated={loadData}
        student={selectedStudent}
      />
    </div>
  );
};

export default CourseDetailPage;
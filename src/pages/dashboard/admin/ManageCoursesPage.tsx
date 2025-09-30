import React, { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { fetchCursosPorEstablecimiento, CursoBase } from '@/api/coursesApi';
import { deleteCourse } from '@/api/adminApi';
import { showError, showSuccess } from '@/utils/toast';
import { MoreHorizontal, Trash2, Edit, PlusCircle, ArrowLeft } from 'lucide-react';
import CourseEditDialog from '@/components/dashboard/admin/CourseEditDialog';
import { Link } from 'react-router-dom';

type CursoConNivelId = CursoBase & { nivel: { id: string, nombre: string } };

const ManageCoursesPage = () => {
  const { activeEstablishment } = useEstablishment();
  const [courses, setCourses] = useState<CursoConNivelId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CursoConNivelId | null>(null);

  const loadCourses = async () => {
    if (!activeEstablishment) {
      setCourses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // This function needs to be adapted to also return nivel id
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nombre, anio, niveles(id, nombre)')
        .eq('establecimiento_id', activeEstablishment.id)
        .order('anio', { ascending: false })
        .order('nombre');
      if (error) throw new Error(error.message);
      
      setCourses(data.filter((c: any) => c.niveles) as CursoConNivelId[]);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [activeEstablishment]);

  const handleAdd = () => {
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: CursoConNivelId) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const handleDelete = async (course: CursoConNivelId) => {
    if (!window.confirm(`¿Seguro que quieres eliminar el curso ${course.nivel.nombre} ${course.nombre}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCourse(course.id);
      showSuccess("Curso eliminado.");
      loadCourses();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel de Administración
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gestión de Cursos del Establecimiento</CardTitle>
              <CardDescription>Crea, edita y elimina los cursos de tu establecimiento.</CardDescription>
            </div>
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Crear Curso</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Cargando cursos...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Curso</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.nivel.nombre} {course.nombre}</TableCell>
                      <TableCell>{course.anio}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(course)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(course)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <CourseEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadCourses}
        course={selectedCourse || undefined}
      />
    </>
  );
};

export default ManageCoursesPage;
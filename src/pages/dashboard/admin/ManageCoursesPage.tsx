import React, { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CursoBase } from '@/api/courses';
import { deleteCourse } from '@/api/admin';
import { showError, showSuccess } from '@/utils/toast';
import { MoreHorizontal, Trash2, Edit, PlusCircle, ArrowLeft } from 'lucide-react';
import CourseEditDialog from '@/components/dashboard/admin/CourseEditDialog';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type CursoConNivelId = CursoBase & { nivel: { id: string, nombre: string } };

const ManageCoursesPage = () => {
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CursoConNivelId | null>(null);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<CursoConNivelId | null>(null);

  const { data: courses = [], isLoading: loading } = useQuery({
    queryKey: ['establishmentCourses', activeEstablishment?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cursos')
        .select('id, nombre, anio, niveles(id, nombre)')
        .eq('establecimiento_id', activeEstablishment!.id)
        .order('anio', { ascending: false })
        .order('nombre');
      if (error) throw new Error(error.message);
      
      const formattedCourses = data
        .filter((c: any) => c.niveles)
        .map((c: any) => ({
          id: c.id,
          nombre: c.nombre,
          anio: c.anio,
          nivel: c.niveles,
        }));
      return formattedCourses;
    },
    enabled: !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      showSuccess("Curso eliminado.");
      queryClient.invalidateQueries({ queryKey: ['establishmentCourses', activeEstablishment?.id] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setAlertOpen(false);
      setCourseToDelete(null);
    }
  });

  const handleAdd = () => {
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: CursoConNivelId) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const handleDelete = (course: CursoConNivelId) => {
    setCourseToDelete(course);
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (courseToDelete) {
      deleteMutation.mutate(courseToDelete.id);
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
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['establishmentCourses', activeEstablishment?.id] })}
        course={selectedCourse || undefined}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el curso {courseToDelete?.nivel.nombre} {courseToDelete?.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageCoursesPage;
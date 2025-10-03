import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchDetallesCursoAsignatura, fetchEstudiantesPorCurso, updateStudentProfile, CursoAsignatura, Estudiante } from '@/api/coursesApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Download } from 'lucide-react';
import { showError } from '@/utils/toast';
import EditStudentDialog from '@/components/courses/EditStudentDialog';
import CourseScheduleManager from '@/components/courses/CourseScheduleManager';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const handleDownloadCredentials = () => {
    if (!cursoInfo || estudiantes.length === 0) {
      showError("No hay estudiantes en este curso para generar credenciales.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`Credenciales de Acceso - ${cursoInfo.curso.nivel.nombre} ${cursoInfo.curso.nombre}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text("A continuación se listan los datos de acceso para los estudiantes.", 14, 30);
    doc.text("La contraseña temporal es el RUT del estudiante, sin puntos ni guion.", 14, 36);

    const tableData = estudiantes.map(est => [
      est.nombre_completo,
      est.email || 'No asignado',
      est.rut ? est.rut.replace(/[.-]/g, '') : 'SIN RUT',
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Nombre Completo', 'Email de Acceso', 'Contraseña Temporal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [34, 49, 63] },
    });

    doc.save(`credenciales-${cursoInfo.curso.nivel.nombre}-${cursoInfo.curso.nombre}.pdf`);
  };

  const handleEditClick = (estudiante: Estudiante) => {
    setSelectedStudent(estudiante);
    setEditDialogOpen(true);
  };

  const handlePieToggle = async (studentId: string, newStatus: boolean) => {
    // Actualización optimista de la UI
    setEstudiantes(currentEstudiantes =>
      currentEstudiantes.map(s =>
        s.id === studentId ? { ...s, apoyo_pie: newStatus } : s
      )
    );

    try {
      await updateStudentProfile(studentId, { apoyo_pie: newStatus });
    } catch (error: any) {
      showError(`Error al actualizar el estado PIE: ${error.message}`);
      // Revertir el cambio en la UI si hay un error
      setEstudiantes(currentEstudiantes =>
        currentEstudiantes.map(s =>
          s.id === studentId ? { ...s, apoyo_pie: !newStatus } : s
        )
      );
    }
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

      <CourseScheduleManager 
        cursoAsignaturaId={cursoInfo.id} 
        cursoNombre={`${cursoInfo.curso.nivel.nombre} ${cursoInfo.curso.nombre}`} 
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Estudiantes</CardTitle>
              <CardDescription>
                Listado de todos los estudiantes inscritos en este curso.
              </CardDescription>
            </div>
            <Button onClick={handleDownloadCredentials}>
              <Download className="mr-2 h-4 w-4" />
              Descargar Credenciales
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead className="text-center">Apoyo PIE</TableHead>
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
                    <TableCell className="text-center">
                      <Switch
                        checked={estudiante.apoyo_pie}
                        onCheckedChange={(newStatus) => handlePieToggle(estudiante.id, newStatus)}
                        aria-label={`Marcar apoyo PIE para ${estudiante.nombre_completo}`}
                      />
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
                  <TableCell colSpan={4} className="text-center">No hay estudiantes inscritos en este curso.</TableCell>
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
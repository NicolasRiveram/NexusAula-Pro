import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { fetchScheduleForCourse, deleteScheduleBlock, ScheduleBlock } from '@/api/scheduleApi';
import { showError, showSuccess } from '@/utils/toast';
import ScheduleEditDialog from '@/components/schedule/ScheduleEditDialog';
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

interface CourseScheduleManagerProps {
  cursoAsignaturaId: string;
  cursoNombre: string;
}

const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const CourseScheduleManager: React.FC<CourseScheduleManagerProps> = ({ cursoAsignaturaId, cursoNombre }) => {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchScheduleForCourse(cursoAsignaturaId);
      setSchedule(data);
    } catch (error: any) {
      showError(`Error al cargar el horario: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [cursoAsignaturaId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleAdd = () => {
    setSelectedBlock(null);
    setDialogOpen(true);
  };

  const handleEdit = (block: ScheduleBlock) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!blockToDelete) return;
    try {
      await deleteScheduleBlock(blockToDelete);
      showSuccess("Bloque de horario eliminado.");
      loadSchedule();
    } catch (error: any) {
      showError(`Error al eliminar: ${error.message}`);
    } finally {
      setAlertOpen(false);
      setBlockToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Horario de Clases</CardTitle>
            <CardDescription>Define los bloques de clases para este curso.</CardDescription>
          </div>
          <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Agregar Horario</Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando horario...</p>
          ) : schedule.length > 0 ? (
            <ul className="space-y-3">
              {schedule.map(block => (
                <li key={block.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-semibold">{diasSemana[block.dia_semana]}</p>
                    <p className="text-sm text-muted-foreground">{block.hora_inicio} - {block.hora_fin}</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(block)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setBlockToDelete(block.id); setAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay horarios definidos para este curso.</p>
          )}
        </CardContent>
      </Card>

      <ScheduleEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadSchedule}
        scheduleBlock={selectedBlock}
        cursosAsignaturas={[{ id: cursoAsignaturaId, asignatura: { nombre: '' }, curso: { nombre: cursoNombre, anio: 0, nivel: { nombre: '' } } }]}
        fixedCursoId={cursoAsignaturaId}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el bloque de horario.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CourseScheduleManager;
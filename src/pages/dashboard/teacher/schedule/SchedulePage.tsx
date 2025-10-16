import React, { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { fetchTeacherSchedule, deleteScheduleBlock, ScheduleBlock } from '@/api/scheduleApi';
import { fetchCursosAsignaturasDocente } from '@/api/courses';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const SchedulePage = () => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: schedule = [], isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['teacherSchedule', user?.id, activeEstablishment?.id],
    queryFn: () => fetchTeacherSchedule(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const { data: cursosAsignaturas = [], isLoading: isLoadingCursos } = useQuery({
    queryKey: ['teacherCoursesForSchedule', user?.id, activeEstablishment?.id],
    queryFn: () => fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScheduleBlock,
    onSuccess: () => {
      showSuccess("Bloque de horario eliminado.");
      queryClient.invalidateQueries({ queryKey: ['teacherSchedule'] });
    },
    onError: (error: any) => {
      showError(`Error al eliminar: ${error.message}`);
    },
    onSettled: () => {
      setAlertOpen(false);
      setBlockToDelete(null);
    }
  });

  const handleAdd = () => {
    setSelectedBlock(null);
    setDialogOpen(true);
  };

  const handleEdit = (block: ScheduleBlock) => {
    setSelectedBlock(block);
    setDialogOpen(true);
  };

  const handleDelete = () => {
    if (blockToDelete) {
      deleteMutation.mutate(blockToDelete);
    }
  };

  const groupedSchedule = schedule.reduce((acc, block) => {
    (acc[block.dia_semana] = acc[block.dia_semana] || []).push(block);
    return acc;
  }, {} as Record<number, ScheduleBlock[]>);

  const loading = isLoadingSchedule || isLoadingCursos;

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mi Horario Semanal</h1>
          <p className="text-muted-foreground">Gestiona tus bloques de clases para el establecimiento activo.</p>
        </div>
        <Button onClick={handleAdd} disabled={!activeEstablishment}>
          <PlusCircle className="mr-2 h-4 w-4" /> Agregar Bloque
        </Button>
      </div>

      {loading ? (
        <p>Cargando horario...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver y gestionar tu horario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {diasSemana.slice(1).map((dia, index) => {
            const diaNum = index + 1;
            const bloques = groupedSchedule[diaNum] || [];
            return (
              <Card key={dia}>
                <CardHeader>
                  <CardTitle>{dia}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bloques.length > 0 ? (
                    bloques.map(block => (
                      <div key={block.id} className="p-3 bg-muted/50 rounded-md relative group">
                        <p className="font-semibold">{block.hora_inicio} - {block.hora_fin}</p>
                        <p className="text-sm text-muted-foreground">{block.curso_asignatura?.curso.nivel.nombre} {block.curso_asignatura?.curso.nombre}</p>
                        <p className="text-xs text-muted-foreground">{block.curso_asignatura?.asignatura.nombre}</p>
                        <div className="absolute top-1 right-1 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(block)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setBlockToDelete(block.id); setAlertOpen(true); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin clases</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ScheduleEditDialog
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['teacherSchedule'] })}
        scheduleBlock={selectedBlock}
        cursosAsignaturas={cursosAsignaturas}
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
    </div>
  );
};

export default SchedulePage;
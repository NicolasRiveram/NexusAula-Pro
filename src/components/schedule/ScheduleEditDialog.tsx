import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CursoAsignatura } from '@/api/coursesApi';
import { ScheduleBlock, saveScheduleBlock } from '@/api/scheduleApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  curso_asignatura_id: z.string().uuid("Debes seleccionar un curso."),
  dia_semana: z.coerce.number().min(1, "Debes seleccionar un día.").max(5, "El día debe ser de Lunes a Viernes."),
  hora_inicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  hora_fin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
});

type FormData = z.infer<typeof schema>;

interface ScheduleEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  scheduleBlock?: ScheduleBlock | null;
  cursosAsignaturas: CursoAsignatura[];
  fixedCursoId?: string;
}

const diasSemana = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
];

const ScheduleEditDialog: React.FC<ScheduleEditDialogProps> = ({ isOpen, onClose, onSaved, scheduleBlock, cursosAsignaturas, fixedCursoId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (scheduleBlock) {
        reset({
          curso_asignatura_id: scheduleBlock.curso_asignatura_id,
          dia_semana: scheduleBlock.dia_semana,
          hora_inicio: scheduleBlock.hora_inicio,
          hora_fin: scheduleBlock.hora_fin,
        });
      } else {
        reset({
          curso_asignatura_id: fixedCursoId || undefined,
          dia_semana: undefined,
          hora_inicio: '',
          hora_fin: '',
        });
      }
    }
  }, [isOpen, scheduleBlock, fixedCursoId, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const toastId = showLoading(scheduleBlock ? "Actualizando horario..." : "Guardando horario...");
    try {
      await saveScheduleBlock({
        curso_asignatura_id: data.curso_asignatura_id,
        dia_semana: data.dia_semana,
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
      }, scheduleBlock?.id);
      dismissToast(toastId);
      showSuccess("Horario guardado correctamente.");
      onSaved();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al guardar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{scheduleBlock ? 'Editar' : 'Agregar'} Bloque de Horario</DialogTitle>
          <DialogDescription>Define el día y la hora para una de tus clases.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="curso_asignatura_id">Curso</Label>
            <Controller
              name="curso_asignatura_id"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={!!fixedCursoId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                  <SelectContent>
                    {cursosAsignaturas.map(ca => (
                      <SelectItem key={ca.id} value={ca.id}>
                        {ca.curso.nivel.nombre} {ca.curso.nombre} - {ca.asignatura.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.curso_asignatura_id && <p className="text-red-500 text-sm">{errors.curso_asignatura_id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dia_semana">Día de la Semana</Label>
            <Controller
              name="dia_semana"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un día" /></SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => <SelectItem key={dia.id} value={String(dia.id)}>{dia.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.dia_semana && <p className="text-red-500 text-sm">{errors.dia_semana.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora de Inicio</Label>
              <Controller name="hora_inicio" control={control} render={({ field }) => <Input id="hora_inicio" type="time" {...field} />} />
              {errors.hora_inicio && <p className="text-red-500 text-sm">{errors.hora_inicio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin">Hora de Fin</Label>
              <Controller name="hora_fin" control={control} render={({ field }) => <Input id="hora_fin" type="time" {...field} />} />
              {errors.hora_fin && <p className="text-red-500 text-sm">{errors.hora_fin.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleEditDialog;
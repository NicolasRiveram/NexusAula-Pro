import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveStage, ProjectStage } from '@/api/projectsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  descripcion: z.string().min(10, "La descripción es requerida."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
});

type FormData = z.infer<typeof schema>;

interface StageEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  projectId: string;
  stage?: ProjectStage | null;
}

const StageEditDialog: React.FC<StageEditDialogProps> = ({ isOpen, onClose, onSaved, projectId, stage }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (stage) {
      reset({
        nombre: stage.nombre,
        descripcion: stage.descripcion,
        fechas: { from: parseISO(stage.fecha_inicio), to: parseISO(stage.fecha_fin) },
      });
    } else {
      reset({ nombre: '', descripcion: '', fechas: undefined });
    }
  }, [stage, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Guardando etapa...");
    try {
      await saveStage(
        projectId,
        {
          nombre: data.nombre,
          descripcion: data.descripcion,
          fecha_inicio: format(data.fechas.from, 'yyyy-MM-dd'),
          fecha_fin: format(data.fechas.to, 'yyyy-MM-dd'),
        },
        stage?.id
      );
      dismissToast(toastId);
      showSuccess("Etapa guardada exitosamente.");
      onSaved();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{stage ? 'Editar' : 'Añadir'} Etapa del Proyecto</DialogTitle>
          <DialogDescription>Define los detalles de esta fase del proyecto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Etapa</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" rows={3} {...field} />} />
            {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>}
          </div>
          <div>
            <Label>Rango de Fechas</Label>
            <Controller
              name="fechas"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "LLL dd, y", { locale: es })} - {format(field.value.to, "LLL dd, y", { locale: es })}</>) : (format(field.value.from, "LLL dd, y", { locale: es }))) : (<span>Selecciona un rango</span>)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar initialFocus mode="range" selected={field.value as DateRange} onSelect={field.onChange} numberOfMonths={1} locale={es} />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.fechas && <p className="text-red-500 text-sm mt-1">{errors.fechas?.from?.message || errors.fechas?.to?.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Etapa'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StageEditDialog;
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveNonSchoolDay, NonSchoolDay } from '@/api/adminApi';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  fecha: z.date({ required_error: "La fecha es requerida." }),
  descripcion: z.string().min(3, "La descripción es requerida."),
  tipo: z.string().min(1, "El tipo es requerido."),
});

type FormData = z.infer<typeof schema>;

interface NonSchoolDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  day?: NonSchoolDay | null;
}

const NonSchoolDayDialog: React.FC<NonSchoolDayDialogProps> = ({ isOpen, onClose, onSaved, day }) => {
  const { activeEstablishment } = useEstablishment();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (day) {
      reset({
        fecha: parseISO(day.fecha),
        descripcion: day.descripcion,
        tipo: day.tipo,
      });
    } else {
      reset({ fecha: undefined, descripcion: '', tipo: '' });
    }
  }, [day, reset]);

  const onSubmit = async (data: FormData) => {
    if (!activeEstablishment) return;
    try {
      await saveNonSchoolDay({
        fecha: format(data.fecha, 'yyyy-MM-dd'),
        descripcion: data.descripcion,
        tipo: data.tipo,
      }, activeEstablishment.id, day?.id);
      showSuccess("Día no lectivo guardado.");
      onSaved();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{day ? 'Editar' : 'Añadir'} Día No Lectivo</DialogTitle>
          <DialogDescription>Este día se marcará como no disponible para la planificación.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label>Fecha</Label>
            <Controller name="fecha" control={control} render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} /></PopoverContent>
              </Popover>
            )} />
            {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha.message}</p>}
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Input id="descripcion" {...field} />} />
            {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>}
          </div>
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Controller name="tipo" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feriado">Feriado</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="evento">Evento del Establecimiento</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            )} />
            {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo.message}</p>}
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

export default NonSchoolDayDialog;
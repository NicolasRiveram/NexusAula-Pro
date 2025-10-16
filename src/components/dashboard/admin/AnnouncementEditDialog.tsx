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
import { saveAnnouncement, Announcement } from '@/api/adminApi';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  mensaje: z.string().min(10, "El mensaje es requerido."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
});

type FormData = z.infer<typeof schema>;

interface AnnouncementEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  announcement?: Announcement | null;
}

const AnnouncementEditDialog: React.FC<AnnouncementEditDialogProps> = ({ isOpen, onClose, onSaved, announcement }) => {
  const { activeEstablishment } = useEstablishment();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (announcement) {
      reset({
        titulo: announcement.titulo,
        mensaje: announcement.mensaje,
        fechas: { from: parseISO(announcement.fecha_inicio), to: parseISO(announcement.fecha_fin) },
      });
    } else {
      reset({ titulo: '', mensaje: '', fechas: undefined });
    }
  }, [announcement, reset]);

  const onSubmit = async (data: FormData) => {
    if (!activeEstablishment) return;
    try {
      await saveAnnouncement({
        titulo: data.titulo,
        mensaje: data.mensaje,
        fecha_inicio: format(data.fechas.from, 'yyyy-MM-dd'),
        fecha_fin: format(data.fechas.to, 'yyyy-MM-dd'),
      }, activeEstablishment.id, announcement?.id);
      showSuccess("Anuncio guardado exitosamente.");
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
          <DialogTitle>{announcement ? 'Editar' : 'Crear'} Anuncio</DialogTitle>
          <DialogDescription>
            Este anuncio será visible para todos los miembros del establecimiento en las fechas seleccionadas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
            {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>}
          </div>
          <div>
            <Label htmlFor="mensaje">Mensaje</Label>
            <Controller name="mensaje" control={control} render={({ field }) => <Textarea id="mensaje" rows={4} {...field} />} />
            {errors.mensaje && <p className="text-red-500 text-sm mt-1">{errors.mensaje.message}</p>}
          </div>
          <div>
            <Label>Rango de Fechas de Visibilidad</Label>
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
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Anuncio'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AnnouncementEditDialog;
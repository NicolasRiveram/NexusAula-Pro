import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { createProject } from '@/api/projectsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  cursoAsignaturaId: z.string().uuid("Debes seleccionar un curso."),
  nombre: z.string().min(3, "El nombre del proyecto es requerido."),
  descripcion: z.string().min(10, "La descripción es requerida."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
  producto_final: z.string().min(3, "El producto final es requerido."),
});

type FormData = z.infer<typeof schema>;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const { activeEstablishment } = useEstablishment();
  const [cursosAsignaturas, setCursosAsignaturas] = useState<CursoAsignatura[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadData = async () => {
      if (isOpen && activeEstablishment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const data = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
            setCursosAsignaturas(data);
          } catch (err: any) {
            showError(`Error al cargar cursos: ${err.message}`);
          }
        }
      }
    };
    loadData();
  }, [isOpen, activeEstablishment]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const toastId = showLoading("Creando proyecto...");
    try {
      await createProject({
        cursoAsignaturaId: data.cursoAsignaturaId,
        nombre: data.nombre,
        descripcion: data.descripcion,
        fecha_inicio: format(data.fechas.from, 'yyyy-MM-dd'),
        fecha_fin: format(data.fechas.to, 'yyyy-MM-dd'),
        producto_final: data.producto_final,
      });
      dismissToast(toastId);
      showSuccess("Proyecto creado exitosamente.");
      onProjectCreated();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al crear el proyecto: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto ABP</DialogTitle>
          <DialogDescription>
            Define los detalles de tu nuevo proyecto de Aprendizaje Basado en Proyectos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cursoAsignaturaId">Curso Asociado</Label>
            <Controller
              name="cursoAsignaturaId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
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
            {errors.cursoAsignaturaId && <p className="text-red-500 text-sm">{errors.cursoAsignaturaId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Proyecto</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" rows={3} {...field} />} />
            {errors.descripcion && <p className="text-red-500 text-sm">{errors.descripcion.message}</p>}
          </div>
          <div className="space-y-2">
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
            {errors.fechas && <p className="text-red-500 text-sm">{errors.fechas?.from?.message || errors.fechas?.to?.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="producto_final">Producto Final Esperado</Label>
            <Controller name="producto_final" control={control} render={({ field }) => <Input id="producto_final" {...field} />} />
            {errors.producto_final && <p className="text-red-500 text-sm">{errors.producto_final.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
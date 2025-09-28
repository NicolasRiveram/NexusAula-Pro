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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { createEvaluation } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  cursoAsignaturaId: z.string().uuid("Debes seleccionar un curso."),
  titulo: z.string().min(3, "El título es requerido."),
  tipo: z.string().min(1, "El tipo de evaluación es requerido."),
  descripcion: z.string().optional(),
  fecha_aplicacion: z.date({ required_error: "La fecha de aplicación es requerida." }),
});

type FormData = z.infer<typeof schema>;

interface CreateEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEvaluationCreated: (newEvaluationId: string) => void;
}

const CreateEvaluationDialog: React.FC<CreateEvaluationDialogProps> = ({ isOpen, onClose, onEvaluationCreated }) => {
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
    const toastId = showLoading("Creando evaluación...");
    try {
      const newEvaluationId = await createEvaluation({
        ...data,
        descripcion: data.descripcion || '',
        fecha_aplicacion: format(data.fecha_aplicacion, 'yyyy-MM-dd'),
      });
      dismissToast(toastId);
      showSuccess("Evaluación creada. Ahora puedes añadirle preguntas.");
      onEvaluationCreated(newEvaluationId);
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al crear la evaluación: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Evaluación</DialogTitle>
          <DialogDescription>
            Completa los detalles básicos de la evaluación. Podrás añadir preguntas después.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cursoAsignaturaId">Curso</Label>
            <Controller name="cursoAsignaturaId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                <SelectContent>{cursosAsignaturas.map(ca => (<SelectItem key={ca.id} value={ca.id}>{ca.curso.nivel.nombre} {ca.curso.nombre} - {ca.asignatura.nombre}</SelectItem>))}</SelectContent>
              </Select>
            )} />
            {errors.cursoAsignaturaId && <p className="text-red-500 text-sm">{errors.cursoAsignaturaId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
            {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Controller name="tipo" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prueba">Prueba</SelectItem>
                  <SelectItem value="Guía de trabajo">Guía de trabajo</SelectItem>
                  <SelectItem value="Disertación">Disertación</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            )} />
            {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_aplicacion">Fecha de Aplicación</Label>
            <Controller name="fecha_aplicacion" control={control} render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
              </Popover>
            )} />
            {errors.fecha_aplicacion && <p className="text-red-500 text-sm">{errors.fecha_aplicacion.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" {...field} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear y Continuar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEvaluationDialog;
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  tipo: z.string().min(1, "El tipo de evaluación es requerido."),
  descripcion: z.string().optional(),
  fecha_aplicacion: z.date({ required_error: "La fecha de aplicación es requerida." }),
  cursoAsignaturaId: z.string().uuid("Debes seleccionar un curso."),
});

export type EvaluationStep1Data = z.infer<typeof schema>;

interface Step1GeneralInfoProps {
  onFormSubmit: (data: EvaluationStep1Data) => void;
}

const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({ onFormSubmit }) => {
  const { activeEstablishment } = useEstablishment();
  const [cursosAsignaturas, setCursosAsignaturas] = useState<CursoAsignatura[]>([]);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<EvaluationStep1Data>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadData = async () => {
      if (activeEstablishment) {
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
  }, [activeEstablishment]);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título de la Evaluación</Label>
          <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
          {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sumativa">Sumativa (Prueba, Examen)</SelectItem>
                <SelectItem value="formativa">Formativa (Guía, Taller)</SelectItem>
                <SelectItem value="rubrica">Rúbrica (Disertación, Proyecto)</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          )} />
          {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
        <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" {...field} />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} /></PopoverContent>
            </Popover>
          )} />
          {errors.fecha_aplicacion && <p className="text-red-500 text-sm">{errors.fecha_aplicacion.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cursoAsignaturaId">Asignar a Curso</Label>
          <Controller
            name="cursoAsignaturaId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                <SelectContent>
                  {cursosAsignaturas.map(ca => (
                    <SelectItem key={ca.id} value={ca.id}>
                      {`${ca.curso.nivel.nombre} ${ca.curso.nombre} - ${ca.asignatura.nombre}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.cursoAsignaturaId && <p className="text-red-500 text-sm">{errors.cursoAsignaturaId.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
        </Button>
      </div>
    </form>
  );
};

export default Step1GeneralInfo;
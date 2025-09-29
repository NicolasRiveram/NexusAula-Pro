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
import { MultiSelect } from '@/components/MultiSelect';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';

const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  descripcion: z.string().optional(),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  cursoAsignaturaIds: z.array(z.string()).min(1, "Debes asignar la evaluación al menos a un curso."),
});

type FormData = z.infer<typeof schema>;

interface Step1GeneralInfoProps {
  onFormSubmit: (data: FormData) => void;
}

const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({ onFormSubmit }) => {
  const { activeEstablishment } = useEstablishment();
  const [cursosAsignaturas, setCursosAsignaturas] = useState<CursoAsignatura[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
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

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    // Aquí iría la lógica para guardar en la BD
    console.log("Datos del paso 1:", data);
    onFormSubmit(data);
    setIsSubmitting(false);
  };

  // Lógica para derivar asignaturas y niveles únicos de los cursos del docente
  const uniqueAsignaturas = Array.from(new Map(cursosAsignaturas.map(ca => [ca.asignatura.nombre, ca.asignatura])).values());
  const uniqueNiveles = Array.from(new Map(cursosAsignaturas.map(ca => [ca.curso.nivel.nombre, ca.curso.nivel])).values());

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título de la Evaluación</Label>
          <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
          {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción (Opcional)</Label>
          <Controller name="descripcion" control={control} render={({ field }) => <Input id="descripcion" {...field} />} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="asignaturaId">Asignatura</Label>
          <Controller name="asignaturaId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
              <SelectContent>{uniqueAsignaturas.map(a => <SelectItem key={a.nombre} value={a.nombre}>{a.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.asignaturaId && <p className="text-red-500 text-sm">{errors.asignaturaId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivelId">Nivel Educativo</Label>
          <Controller name="nivelId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
              <SelectContent>{uniqueNiveles.map(n => <SelectItem key={n.nombre} value={n.nombre}>{n.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.nivelId && <p className="text-red-500 text-sm">{errors.nivelId.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cursoAsignaturaIds">Asignar a Cursos</Label>
        <Controller
          name="cursoAsignaturaIds"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={cursosAsignaturas.map(ca => ({ value: ca.id, label: `${ca.curso.nivel.nombre} ${ca.curso.nombre} - ${ca.asignatura.nombre}` }))}
              selected={field.value || []}
              onValueChange={field.onChange}
              placeholder="Selecciona uno o más cursos"
            />
          )}
        />
        {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm">{errors.cursoAsignaturaIds.message}</p>}
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
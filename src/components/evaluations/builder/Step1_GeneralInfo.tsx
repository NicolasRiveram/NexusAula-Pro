import React, { useState, useEffect } from 'react';
import { Controller, Control, useFormState, useWatch, UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { fetchObjetivosAprendizaje, ObjetivoAprendizaje } from '@/api/evaluationsApi';
import { showError, showSuccess } from '@/utils/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MultiSelect } from '@/components/MultiSelect';
import { FunctionsHttpError } from '@supabase/supabase-js';

export const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  tipo: z.string().min(1, "El tipo de evaluación es requerido."),
  momento_evaluativo: z.string().min(1, "El momento evaluativo es requerido."),
  descripcion: z.string().optional(),
  fecha_aplicacion: z.date({ required_error: "La fecha de aplicación es requerida." }),
  cursoAsignaturaIds: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos un curso."),
  objetivos_aprendizaje_ids: z.array(z.string().uuid()).optional(),
  objetivosSugeridos: z.string().optional(),
});

export type EvaluationStep1Data = z.infer<typeof schema>;

interface Step1GeneralInfoProps {
  onFormSubmit: (e: React.BaseSyntheticEvent) => Promise<void>;
  control: Control<any>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
}

const Step1GeneralInfo: React.FC<Step1GeneralInfoProps> = ({ onFormSubmit, control, isSubmitting, setValue, getValues }) => {
  const { activeEstablishment } = useEstablishment();
  const [cursosAsignaturas, setCursosAsignaturas] = useState<CursoAsignatura[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoAprendizaje[]>([]);
  const [loadingOAs, setLoadingOAs] = useState(false);
  const [isSuggestingOAs, setIsSuggestingOAs] = useState(false);
  
  const { errors } = useFormState({ control });
  const cursoAsignaturaIds = useWatch({ control, name: 'cursoAsignaturaIds' });
  const descripcion = useWatch({ control, name: 'descripcion' });

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

  useEffect(() => {
    const loadOAs = async () => {
      if (cursoAsignaturaIds && cursoAsignaturaIds.length > 0) {
        setLoadingOAs(true);
        try {
          const selectedCourses = cursosAsignaturas.filter(ca => cursoAsignaturaIds.includes(ca.id));
          const nivelIds = [...new Set(selectedCourses.map(c => c.curso.nivel.id))];
          const asignaturaIds = [...new Set(selectedCourses.map(c => c.asignatura.id))];
          
          if (nivelIds.length > 0 && asignaturaIds.length > 0) {
            const oasData = await fetchObjetivosAprendizaje(nivelIds, asignaturaIds);
            setObjetivos(oasData);
          } else {
            setObjetivos([]);
          }
        } catch (err: any) {
          showError(`Error al cargar Objetivos de Aprendizaje: ${err.message}`);
          setObjetivos([]);
        } finally {
          setLoadingOAs(false);
        }
      } else {
        setObjetivos([]);
      }
    };
    loadOAs();
  }, [cursoAsignaturaIds, cursosAsignaturas]);

  const handleSuggestOAs = async () => {
    const { cursoAsignaturaIds, descripcion } = getValues();
    if (!cursoAsignaturaIds || cursoAsignaturaIds.length === 0 || !descripcion) {
      showError("Por favor, selecciona al menos un curso y escribe una descripción para obtener sugerencias.");
      return;
    }
    
    const firstCurso = cursosAsignaturas.find(c => c.id === cursoAsignaturaIds[0]);
    if (!firstCurso) return;

    setIsSuggestingOAs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión de usuario activa.");

      const { data, error } = await supabase.functions.invoke('suggest-learning-objectives', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          nivelId: firstCurso.curso.nivel.id, 
          asignaturaId: firstCurso.asignatura.id, 
          tema: descripcion 
        },
      });

      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(errorMessage.error);
      } else if (error) {
        throw error;
      }

      setValue('objetivosSugeridos', data.suggestions);
      showSuccess("Objetivos de aprendizaje sugeridos por la IA.");
    } catch (error: any) {
      showError(`Error al sugerir OAs: ${error.message}`);
    } finally {
      setIsSuggestingOAs(false);
    }
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título de la Evaluación</Label>
          <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
          {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="prueba">Prueba</SelectItem>
                <SelectItem value="guia_de_trabajo">Guía de trabajo</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          )} />
          {errors.tipo && <p className="text-red-500 text-sm">{errors.tipo.message as string}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción (Opcional)</Label>
        <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" {...field} />} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="momento_evaluativo">Momento Evaluativo</Label>
          <Controller name="momento_evaluativo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un momento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="diagnostica">Diagnóstica</SelectItem>
                <SelectItem value="formativa">Formativa</SelectItem>
                <SelectItem value="sumativa">Sumativa</SelectItem>
              </SelectContent>
            </Select>
          )} />
          {errors.momento_evaluativo && <p className="text-red-500 text-sm">{errors.momento_evaluativo.message as string}</p>}
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
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} /></PopoverContent>
            </Popover>
          )} />
          {errors.fecha_aplicacion && <p className="text-red-500 text-sm">{errors.fecha_aplicacion.message as string}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cursoAsignaturaIds">Asignar a Cursos</Label>
        <Controller
          name="cursoAsignaturaIds"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={cursosAsignaturas.map(ca => ({
                value: ca.id,
                label: `${ca.curso.nivel.nombre} ${ca.curso.nombre} - ${ca.asignatura.nombre}`
              }))}
              selected={field.value || []}
              onValueChange={field.onChange}
              placeholder="Selecciona uno o más cursos"
            />
          )}
        />
        {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm">{errors.cursoAsignaturaIds.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="objetivos_aprendizaje_ids">Objetivos de Aprendizaje (OA) Principales</Label>
        {loadingOAs && <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando OAs...</div>}
        <Controller
          name="objetivos_aprendizaje_ids"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={objetivos.map(oa => ({
                value: oa.id,
                label: `${oa.codigo}: ${oa.descripcion}`
              }))}
              selected={field.value || []}
              onValueChange={field.onChange}
              placeholder="Selecciona los OAs que aborda esta evaluación"
              disabled={loadingOAs || !cursoAsignaturaIds || cursoAsignaturaIds.length === 0}
            />
          )}
        />
        {errors.objetivos_aprendizaje_ids && <p className="text-red-500 text-sm">{errors.objetivos_aprendizaje_ids.message as string}</p>}
        
        {!loadingOAs && objetivos.length === 0 && cursoAsignaturaIds && cursoAsignaturaIds.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-blue-800 dark:text-blue-300">¿Necesitas ayuda con los Objetivos?</h4>
              <Button type="button" variant="outline" size="sm" onClick={handleSuggestOAs} disabled={isSuggestingOAs || !descripcion}>
                {isSuggestingOAs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Sugerir OAs con IA
              </Button>
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
              No se encontraron OAs en la base de datos para los cursos seleccionados. Escribe una descripción de la evaluación y la IA te sugerirá los objetivos pertinentes.
            </p>
            <Controller
              name="objetivosSugeridos"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Las sugerencias de la IA aparecerán aquí..."
                  rows={5}
                  readOnly={isSuggestingOAs}
                />
              )}
            />
          </div>
        )}
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
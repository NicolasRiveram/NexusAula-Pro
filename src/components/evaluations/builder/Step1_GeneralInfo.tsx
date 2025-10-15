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
import { fetchCursosAsignaturasDocente, CursoAsignatura, fetchDocenteAsignaturas, Asignatura, fetchDocenteNiveles, Nivel } from '@/api/coursesApi';
import { fetchObjetivosAprendizaje, ObjetivoAprendizaje } from '@/api/evaluationsApi';
import { showError, showSuccess } from '@/utils/toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MultiSelect } from '@/components/MultiSelect';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';

export const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  descripcion: z.string().optional(),
  tipo: z.string().min(1, "El tipo de evaluación es requerido."),
  momento_evaluativo: z.string().min(1, "El momento evaluativo es requerido."),
  habilidades: z.array(z.string()).min(1, "Debes agregar al menos una habilidad."),
  fecha_aplicacion: z.date().optional(),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  cursoAsignaturaIds: z.array(z.string().uuid()).optional(),
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
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [objetivos, setObjetivos] = useState<ObjetivoAprendizaje[]>([]);
  const [loadingOAs, setLoadingOAs] = useState(false);
  const [isSuggestingOAs, setIsSuggestingOAs] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  
  const { errors } = useFormState({ control });
  const [asignaturaId, nivelId, habilidades] = useWatch({ control, name: ['asignaturaId', 'nivelId', 'habilidades'] });

  useEffect(() => {
    const loadData = async () => {
      if (activeEstablishment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const [asignaturasData, nivelesData, cursosData] = await Promise.all([
              fetchDocenteAsignaturas(user.id),
              fetchDocenteNiveles(user.id),
              fetchCursosAsignaturasDocente(user.id, activeEstablishment.id)
            ]);
            setAsignaturas(asignaturasData);
            setNiveles(nivelesData);
            setCursosAsignaturas(cursosData);
          } catch (err: any) {
            showError(`Error al cargar datos: ${err.message}`);
          }
        }
      }
    };
    loadData();
  }, [activeEstablishment]);

  useEffect(() => {
    const loadOAs = async () => {
      if (nivelId && asignaturaId) {
        setLoadingOAs(true);
        try {
          const oasData = await fetchObjetivosAprendizaje([nivelId], [asignaturaId]);
          setObjetivos(oasData);
        } catch (err: any) {
          showError(`Error al cargar OAs: ${err.message}`);
        } finally {
          setLoadingOAs(false);
        }
      } else {
        setObjetivos([]);
      }
    };
    loadOAs();
  }, [nivelId, asignaturaId]);

  const handleAddSkill = () => {
    if (currentSkill.trim()) {
      const currentHabilidades = getValues('habilidades') || [];
      if (!currentHabilidades.includes(currentSkill.trim())) {
        setValue('habilidades', [...currentHabilidades, currentSkill.trim()], { shouldValidate: true });
      }
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentHabilidades = getValues('habilidades') || [];
    setValue('habilidades', currentHabilidades.filter((s: string) => s !== skillToRemove), { shouldValidate: true });
  };

  const handleSuggestOAs = async () => {
    if (!nivelId || !asignaturaId || !habilidades || habilidades.length === 0) {
      showError("Por favor, selecciona nivel, asignatura y agrega al menos una habilidad para obtener sugerencias.");
      return;
    }
    
    setIsSuggestingOAs(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión de usuario activa.");

      const { data, error } = await supabase.functions.invoke('suggest-learning-objectives', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { nivelId, asignaturaId, tema: habilidades.join(', ') },
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
      <div className="space-y-2">
        <Label htmlFor="titulo">Título de la Evaluación</Label>
        <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
        {errors.titulo && <p className="text-red-500 text-sm">{errors.titulo.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción y Contexto para la IA</Label>
        <Controller name="descripcion" control={control} render={({ field }) => 
          <Textarea 
            id="descripcion" 
            rows={4} 
            placeholder="Describe el contexto de la evaluación, la unidad, los contenidos, o cualquier indicación especial para la IA (ej: 'generar la evaluación en inglés')."
            {...field} 
          />
        } />
        {errors.descripcion && <p className="text-red-500 text-sm">{errors.descripcion.message as string}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="asignaturaId">Asignatura</Label>
          <Controller name="asignaturaId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
              <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.asignaturaId && <p className="text-red-500 text-sm">{errors.asignaturaId.message as string}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="nivelId">Nivel</Label>
          <Controller name="nivelId" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
              <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
            </Select>
          )} />
          {errors.nivelId && <p className="text-red-500 text-sm">{errors.nivelId.message as string}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="habilidades">Habilidades a Evaluar</Label>
        <div className="flex gap-2">
          <Input
            id="habilidades"
            placeholder="Escribe una habilidad y presiona 'Añadir'"
            value={currentSkill}
            onChange={(e) => setCurrentSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
          />
          <Button type="button" onClick={handleAddSkill}>Añadir Habilidad</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 min-h-[24px]">
          {habilidades?.map((skill: string) => (
            <Badge key={skill} variant="secondary" className="text-base">
              {skill}
              <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-2 rounded-full hover:bg-destructive/80 p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        {errors.habilidades && <p className="text-red-500 text-sm">{errors.habilidades.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="fecha_aplicacion">Fecha de Aplicación (Opcional)</Label>
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
      <div className="space-y-2">
        <Label htmlFor="cursoAsignaturaIds">Asignar a Cursos (Opcional)</Label>
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
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="objetivosSugeridos">Objetivos de Aprendizaje (Opcional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleSuggestOAs} disabled={isSuggestingOAs || !habilidades || habilidades.length === 0 || !nivelId || !asignaturaId}>
            {isSuggestingOAs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Sugerir OAs
          </Button>
        </div>
        <Controller name="objetivosSugeridos" control={control} render={({ field }) => <Textarea id="objetivosSugeridos" rows={4} placeholder="Las sugerencias de la IA aparecerán aquí..." {...field} />} />
        
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
              disabled={loadingOAs || !nivelId || !asignaturaId}
            />
          )}
        />
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
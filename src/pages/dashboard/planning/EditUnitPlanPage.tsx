import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MultiSelect } from '@/components/MultiSelect';
import { ArrowLeft, Loader2, Save, CalendarIcon, Edit, Sparkles } from 'lucide-react';
import { fetchUnitPlanDetails, updateUnitPlanDetails, updateClassDetails, UnitPlanDetail, ScheduledClass, UpdateClassPayload, scheduleClassesFromUnitPlan } from '@/api/planningApi';
import { fetchCursosAsignaturasDocente } from '@/api/coursesApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { supabase } from '@/integrations/supabase/client';
import EditClassDialog from '@/components/planning/EditClassDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FunctionsHttpError } from '@supabase/supabase-js';

const schema = z.object({
  titulo: z.string().min(3, "El título es requerido."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
  descripcionContenidos: z.string().min(10, "Describe los contenidos a abordar."),
  cursoAsignaturaIds: z.array(z.string()).min(1, "Debes seleccionar al menos un curso."),
});

type FormData = z.infer<typeof schema>;

const EditUnitPlanPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [plan, setPlan] = useState<UnitPlanDetail | null>(null);
  const [allCourses, setAllCourses] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClassEditDialogOpen, setClassEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isReprogramming, setIsReprogramming] = useState(false);
  const [isReprogramConfirmOpen, setReprogramConfirmOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loadData = useCallback(async () => {
    if (planId) {
      setLoading(true);
      try {
        const planData = await fetchUnitPlanDetails(planId);
        setPlan(planData);
        reset({
          titulo: planData.titulo,
          descripcionContenidos: planData.descripcion_contenidos,
          fechas: { from: parseISO(planData.fecha_inicio), to: parseISO(planData.fecha_fin) },
          cursoAsignaturaIds: planData.unidad_maestra_curso_asignatura_link.map((link: any) => link.curso_asignaturas.id),
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user && activeEstablishment) {
          const coursesData = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
          setAllCourses(coursesData.map(c => ({
            value: c.id,
            label: `${c.curso.nivel.nombre} ${c.curso.nombre} - ${c.asignatura.nombre}`
          })));
        }
      } catch (err: any) {
        showError(`Error al cargar el plan: ${err.message}`);
        navigate('/dashboard/planificacion');
      } finally {
        setLoading(false);
      }
    }
  }, [planId, reset, navigate, activeEstablishment]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onSubmit = async (data: FormData) => {
    if (!planId) return;
    setIsSaving(true);
    try {
      await updateUnitPlanDetails(planId, {
        titulo: data.titulo,
        descripcion_contenidos: data.descripcionContenidos,
        fecha_inicio: format(data.fechas.from, 'yyyy-MM-dd'),
        fecha_fin: format(data.fechas.to, 'yyyy-MM-dd'),
        cursoAsignaturaIds: data.cursoAsignaturaIds,
      });
      showSuccess("Plan de unidad actualizado. Si cambiaste fechas o cursos, considera reprogramar las clases.");
      loadData();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReprogram = async () => {
    if (!planId || !plan || !plan.sugerencias_ia || !activeEstablishment) {
      showError("Faltan datos para reprogramar. Asegúrate de que el plan tenga sugerencias de IA guardadas.");
      return;
    }
    setIsReprogramming(true);
    const toastId = showLoading("Reprogramando clases con IA... (Esto puede tardar)");
    try {
      const formData = getValues();
      
      // Get all unit IDs associated with this master plan's classes before deleting them
      const { data: unitsWithClasses, error: fetchError } = await supabase
        .from('planificaciones_clase')
        .select('unidad_id')
        .eq('unidad_maestra_id', planId);
      if (fetchError) throw fetchError;
      const unitIdsToDelete = [...new Set(unitsWithClasses.map(c => c.unidad_id).filter(Boolean))];

      // Delete all classes associated with the master plan ID.
      const { error: deleteClassesError } = await supabase
        .from('planificaciones_clase')
        .delete()
        .eq('unidad_maestra_id', planId);
      if (deleteClassesError) throw new Error(`Error deleting old classes: ${deleteClassesError.message}`);

      // Now delete the old unit containers
      if (unitIdsToDelete.length > 0) {
        const { error: deleteUnitsError } = await supabase
          .from('unidades')
          .delete()
          .in('id', unitIdsToDelete);
        if (deleteUnitsError) throw new Error(`Error deleting old units: ${deleteUnitsError.message}`);
      }

      const { data: classCount, error: countError } = await supabase.rpc('calculate_class_slots', {
        p_start_date: format(formData.fechas.from, 'yyyy-MM-dd'),
        p_end_date: format(formData.fechas.to, 'yyyy-MM-dd'),
        p_curso_asignatura_ids: formData.cursoAsignaturaIds,
        p_establecimiento_id: activeEstablishment.id,
      });
      if (countError) throw countError;
      if (!classCount || classCount <= 0) {
        throw new Error("No se encontraron bloques de horario disponibles para los cursos y fechas seleccionados. Por favor, revisa tu horario o el rango de fechas y vuelve a intentarlo.");
      }

      const { data: sequence, error: sequenceError } = await supabase.functions.invoke('generate-class-sequence', {
        body: { 
          suggestions: plan.sugerencias_ia, 
          projectContext: null,
          classCount 
        },
      });
      if (sequenceError) {
        if (sequenceError instanceof FunctionsHttpError) {
            const errorMessage = await sequenceError.context.json();
            throw new Error(`Error en la IA: ${errorMessage.error}`);
        }
        throw sequenceError;
      }
      
      const classesToSave = sequence.map(({ id, fecha, ...rest }: any) => rest);
      await scheduleClassesFromUnitPlan(planId, classesToSave);

      dismissToast(toastId);
      showSuccess("Clases reprogramadas exitosamente.");
      loadData();

    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al reprogramar: ${error.message}`);
    } finally {
      setIsReprogramming(false);
    }
  };

  const handleEditClass = (clase: ScheduledClass) => {
    setSelectedClass(clase);
    setClassEditDialogOpen(true);
  };

  const handleSaveClass = async (classId: string, data: UpdateClassPayload) => {
    try {
      await updateClassDetails(classId, data);
      showSuccess("Clase actualizada.");
      setClassEditDialogOpen(false);
      loadData();
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/planificacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Planificador
        </Link>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Editar Plan de Unidad</CardTitle>
              <CardDescription>Modifica los detalles generales de tu planificación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título de la Unidad</Label>
                <Controller name="titulo" control={control} render={({ field }) => <Input id="titulo" {...field} />} />
                {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>}
              </div>
              <div>
                <Label>Cursos</Label>
                <Controller name="cursoAsignaturaIds" control={control} render={({ field }) => (
                  <MultiSelect options={allCourses} selected={field.value || []} onValueChange={field.onChange} />
                )} />
                {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm mt-1">{errors.cursoAsignaturaIds.message}</p>}
              </div>
              <div>
                <Label>Rango de Fechas</Label>
                <Controller name="fechas" control={control} render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (field.value.to ? (<>{format(field.value.from, "P", { locale: es })} - {format(field.value.to, "P", { locale: es })}</>) : format(field.value.from, "P", { locale: es })) : <span>Selecciona un rango</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="range" selected={field.value as DateRange} onSelect={field.onChange} locale={es} /></PopoverContent>
                  </Popover>
                )} />
                {errors.fechas && <p className="text-red-500 text-sm mt-1">{errors.fechas?.from?.message || errors.fechas?.to?.message}</p>}
              </div>
              <div>
                <Label htmlFor="descripcionContenidos">Contenidos y Temas</Label>
                <Controller name="descripcionContenidos" control={control} render={({ field }) => <Textarea id="descripcionContenidos" rows={4} {...field} />} />
                {errors.descripcionContenidos && <p className="text-red-500 text-sm mt-1">{errors.descripcionContenidos.message}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Clases Programadas</CardTitle>
            <CardDescription>
              {plan?.clases && plan.clases.length > 0 
                ? "Edita individualmente cada clase o reprograma la secuencia completa si cambiaste las fechas o cursos."
                : "No hay clases programadas para esta unidad."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan?.clases && plan.clases.length > 0 ? (
              plan.clases.map(clase => (
                <div key={clase.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                  <div>
                    <p className="font-semibold">{clase.titulo}</p>
                    <p className="text-sm text-muted-foreground">{format(parseISO(clase.fecha), "EEEE d 'de' LLLL", { locale: es })}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEditClass(clase)}><Edit className="mr-2 h-4 w-4" /> Editar Clase</Button>
                </div>
              ))
            ) : null}
            <div className="pt-4 text-center">
              <Button onClick={() => setReprogramConfirmOpen(true)} disabled={isReprogramming}>
                {isReprogramming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Reprogramar Clases con IA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditClassDialog
        isOpen={isClassEditDialogOpen}
        onOpenChange={setClassEditDialogOpen}
        clase={selectedClass}
        onSave={handleSaveClass}
      />
      <AlertDialog open={isReprogramConfirmOpen} onOpenChange={setReprogramConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reprogramar la secuencia de clases?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará todas las clases programadas actualmente para esta unidad y generará una nueva secuencia usando IA. Esto es útil si has cambiado las fechas, los cursos, o el contenido de la unidad. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReprogram}>Sí, Reprogramar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditUnitPlanPage;
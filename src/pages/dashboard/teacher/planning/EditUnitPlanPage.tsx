import React, { useState, useEffect } from 'react';
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
import { updateUnitPlanDetails, updateClassDetails, ScheduledClass, UpdateClassPayload, scheduleClassesFromUnitPlan } from '@/api/planning';
import { fetchCursosAsignaturasDocente } from '@/api/courses';
import { showError, showSuccess } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { supabase } from '@/integrations/supabase/client';
import EditClassDialog from '@/components/planning/EditClassDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isClassEditDialogOpen, setClassEditDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isReprogramConfirmOpen, setReprogramConfirmOpen] = useState(false);
  const [isMissingScheduleAlertOpen, setMissingScheduleAlertOpen] = useState(false);
  const [missingScheduleCourses, setMissingScheduleCourses] = useState<string[]>([]);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['unitPlanDetails', planId],
    queryFn: () => fetchUnitPlanDetails(planId!),
    enabled: !!planId,
    onSuccess: (data) => {
      reset({
        titulo: data.titulo,
        descripcionContenidos: data.descripcion_contenidos,
        fechas: { from: parseISO(data.fecha_inicio), to: parseISO(data.fecha_fin) },
        cursoAsignaturaIds: data.unidad_maestra_curso_asignatura_link.map((link: any) => link.curso_asignaturas.id),
      });
    },
    onError: (err: any) => {
      showError(`Error al cargar el plan: ${err.message}`);
      navigate('/dashboard/planificacion');
    }
  });

  const { data: allCourses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['teacherCoursesForPlanning', user?.id, activeEstablishment?.id],
    queryFn: () => fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
    select: (data) => data.map(c => ({
      value: c.id,
      label: `${c.curso.nivel.nombre} ${c.curso.nombre} - ${c.asignatura.nombre}`
    })),
  });

  const savePlanMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!planId) throw new Error("ID del plan no encontrado.");
      return updateUnitPlanDetails(planId, {
        titulo: data.titulo,
        descripcion_contenidos: data.descripcionContenidos,
        fecha_inicio: format(data.fechas.from, 'yyyy-MM-dd'),
        fecha_fin: format(data.fechas.to, 'yyyy-MM-dd'),
        cursoAsignaturaIds: data.cursoAsignaturaIds,
      });
    },
    onSuccess: () => {
      showSuccess("Plan de unidad actualizado.");
      queryClient.invalidateQueries({ queryKey: ['unitPlanDetails', planId] });
      setReprogramConfirmOpen(true);
    },
    onError: (error: any) => showError(error.message),
  });

  const reprogramMutation = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("ID del plan no encontrado.");
      
      const { data: links } = await supabase
        .from('unidad_maestra_curso_asignatura_link')
        .select('curso_asignaturas(id, cursos(niveles(nombre), nombre), asignaturas(nombre))')
        .eq('unidad_maestra_id', planId);

      const coursesWithMissingSchedules: string[] = [];
      for (const link of (links || [])) {
        const { count } = await supabase
          .from('horario_curso')
          .select('id', { count: 'exact', head: true })
          .eq('curso_asignatura_id', link.curso_asignaturas.id);
        if (count === 0) {
          const ca = link.curso_asignaturas;
          coursesWithMissingSchedules.push(`${ca.cursos.niveles.nombre} ${ca.cursos.nombre} - ${ca.asignaturas.nombre}`);
        }
      }

      if (coursesWithMissingSchedules.length > 0) {
        setMissingScheduleCourses(coursesWithMissingSchedules);
        setMissingScheduleAlertOpen(true);
        throw new Error("Faltan horarios"); // Prevent further execution
      }
      
      return scheduleClassesFromUnitPlan(planId);
    },
    onSuccess: () => {
      showSuccess("Clases programadas/reprogramadas exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['unitPlanDetails', planId] });
    },
    onError: (error: any) => {
      if (error.message !== "Faltan horarios") {
        showError(`Error al programar: ${error.message}`);
      }
    },
    onSettled: () => {
      setReprogramConfirmOpen(false);
    }
  });

  const saveClassMutation = useMutation({
    mutationFn: (vars: { classId: string, data: UpdateClassPayload }) => updateClassDetails(vars.classId, vars.data),
    onSuccess: () => {
      showSuccess("Clase actualizada.");
      setClassEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['unitPlanDetails', planId] });
    },
    onError: (error: any) => showError(error.message),
  });

  const handleEditClass = (clase: ScheduledClass) => {
    setSelectedClass(clase);
    setClassEditDialogOpen(true);
  };

  if (loadingPlan || loadingCourses) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/planificacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Planificador
        </Link>

        <form onSubmit={handleSubmit((data) => savePlanMutation.mutate(data))}>
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
                <Button type="submit" disabled={savePlanMutation.isPending}>
                  {savePlanMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                    <p className="text-sm text-muted-foreground">{clase.fecha ? format(parseISO(clase.fecha), "EEEE d 'de' LLLL", { locale: es }) : 'Plantilla sin fecha'}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedClass(clase); setClassEditDialogOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Editar Clase</Button>
                </div>
              ))
            ) : null}
            <div className="pt-4 text-center">
              <Button onClick={() => reprogramMutation.mutate()} disabled={reprogramMutation.isPending}>
                {reprogramMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {plan?.clases && plan.clases.length > 0 ? 'Reprogramar Clases' : 'Programar Clases'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <EditClassDialog
        isOpen={isClassEditDialogOpen}
        onOpenChange={setClassEditDialogOpen}
        clase={selectedClass}
        onSave={(classId, data) => saveClassMutation.mutate({ classId, data })}
      />
      <AlertDialog open={isReprogramConfirmOpen} onOpenChange={setReprogramConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Programar/Reprogramar la secuencia de clases?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará las clases previamente programadas para esta unidad y generará una nueva secuencia en el calendario basada en los cursos, fechas y horarios disponibles. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => reprogramMutation.mutate()}>Sí, Programar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isMissingScheduleAlertOpen} onOpenChange={setMissingScheduleAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Falta Horario</AlertDialogTitle>
            <AlertDialogDescription>
              No se puede programar porque los siguientes cursos no tienen un horario definido:
              <ul className="list-disc list-inside my-2 bg-muted/50 p-2 rounded-md">
                  {missingScheduleCourses.map(name => <li key={name}>{name}</li>)}
              </ul>
              Por favor, ve a "Mis Cursos" para configurar el horario antes de continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setMissingScheduleAlertOpen(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditUnitPlanPage;
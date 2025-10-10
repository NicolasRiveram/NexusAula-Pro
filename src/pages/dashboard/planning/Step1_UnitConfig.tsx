import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MultiSelect } from '@/components/MultiSelect';
import { showError, showSuccess } from '@/utils/toast';
import { fetchRelevantProjects, SimpleProject } from '@/api/projectsApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateProjectDialog from '@/components/projects/CreateProjectDialog';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { fetchDocenteAsignaturas, Asignatura, Nivel, fetchDocenteNiveles } from '@/api/coursesApi';

const schema = z.object({
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  cursoAsignaturaIds: z.array(z.string()).optional(), // Ahora es opcional
  titulo: z.string().min(3, "El título es requerido."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
  descripcionContenidos: z.string().min(10, "Describe los contenidos a abordar."),
  instruccionesAdicionales: z.string().optional(),
  proyectoId: z.string().optional(),
});

export type UnitPlanFormData = z.infer<typeof schema>;

interface CursoParaSeleccion {
  id: string;
  nombre: string;
  nivelId: string;
  asignaturaId: string;
}

interface Step1UnitConfigProps {
  onFormSubmit: (data: UnitPlanFormData) => void;
  isLoading: boolean;
}

const Step1UnitConfig: React.FC<Step1UnitConfigProps> = ({ onFormSubmit, isLoading }) => {
  const { activeEstablishment } = useEstablishment();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [cursos, setCursos] = useState<CursoParaSeleccion[]>([]);
  const [relevantProjects, setRelevantProjects] = useState<SimpleProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [initialProjectData, setInitialProjectData] = useState<Partial<any>>({});
  const [isSuggestingContent, setIsSuggestingContent] = useState(false);

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<UnitPlanFormData>({
    resolver: zodResolver(schema),
  });

  const selectedCursoAsignaturaIds = watch('cursoAsignaturaIds');
  const selectedAsignaturaId = watch('asignaturaId');
  const selectedNivelId = watch('nivelId');

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!activeEstablishment) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const [asignaturasData, nivelesData, cursosData] = await Promise.all([
          fetchDocenteAsignaturas(user.id),
          fetchDocenteNiveles(user.id),
          supabase.from('curso_asignaturas').select('id, asignatura_id, cursos!inner(nombre, nivel_id, niveles(nombre))').eq('docente_id', user.id).eq('cursos.establecimiento_id', activeEstablishment.id)
        ]);

        setAsignaturas(asignaturasData);
        setNiveles(nivelesData);

        const cursosParaSeleccion = (cursosData.data || []).map((ca: any) => ({
          id: ca.id,
          nombre: `${ca.cursos.niveles.nombre} - ${ca.cursos.nombre}`,
          nivelId: ca.cursos.nivel_id,
          asignaturaId: ca.asignatura_id,
        })).filter(Boolean) as CursoParaSeleccion[];
        setCursos(cursosParaSeleccion);

      } catch (error: any) {
        showError("Error al cargar datos iniciales: " + error.message);
      }
    };
    fetchInitialData();
  }, [activeEstablishment]);

  useEffect(() => {
    const getProjects = async () => {
        if (selectedCursoAsignaturaIds && selectedCursoAsignaturaIds.length > 0) {
            setLoadingProjects(true);
            try {
                const projects = await fetchRelevantProjects(selectedCursoAsignaturaIds);
                setRelevantProjects(projects);
            } catch (error: any) {
                showError("Error al cargar proyectos: " + error.message);
            } finally {
                setLoadingProjects(false);
            }
        } else {
            setRelevantProjects([]);
        }
    };
    getProjects();
  }, [selectedCursoAsignaturaIds]);

  const handleSuggestContent = async () => {
    const { nivelId, asignaturaId, descripcionContenidos } = getValues();
    if (!nivelId || !asignaturaId || !descripcionContenidos) {
      showError("Por favor, selecciona asignatura, nivel y escribe un tema para obtener sugerencias.");
      return;
    }
    
    setIsSuggestingContent(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión de usuario activa.");

      const { data, error } = await supabase.functions.invoke('suggest-unit-content', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { nivelId, asignaturaId, tema: descripcionContenidos },
      });

      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(errorMessage.error);
      } else if (error) {
        throw error;
      }

      setValue('descripcionContenidos', data.suggestions, { shouldValidate: true });
      showSuccess("Contenidos sugeridos por la IA.");
    } catch (error: any) {
      showError(`Error al sugerir contenido: ${error.message}`);
    } finally {
      setIsSuggestingContent(false);
    }
  };

  const openCreateProjectDialog = () => {
    const currentFormData = getValues();
    setInitialProjectData({
        nombre: currentFormData.titulo,
        descripcion: currentFormData.descripcionContenidos,
        fechas: currentFormData.fechas,
        cursoAsignaturaIds: currentFormData.cursoAsignaturaIds,
    });
    setCreateProjectDialogOpen(true);
  };

  const handleProjectCreated = (newProject: { id: string; nombre: string }) => {
    setRelevantProjects(prev => [...prev, newProject]);
    setValue('proyectoId', newProject.id, { shouldValidate: true });
    setCreateProjectDialogOpen(false);
  };

  const cursosFiltrados = useMemo(() => {
    if (!selectedAsignaturaId || !selectedNivelId) return [];
    return cursos.filter(c => c.asignaturaId === selectedAsignaturaId && c.nivelId === selectedNivelId);
  }, [cursos, selectedAsignaturaId, selectedNivelId]);

  return (
    <>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>1. Asignatura</Label>
            <Controller name="asignaturaId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{errors.asignaturaId.message}</p>}
          </div>
          <div>
            <Label>2. Nivel</Label>
            <Controller name="nivelId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message}</p>}
          </div>
        </div>

        <div>
          <Label>3. Cursos Específicos (Opcional)</Label>
          <Controller
            name="cursoAsignaturaIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={cursosFiltrados.map(c => ({ value: c.id, label: c.nombre }))}
                selected={field.value || []}
                onValueChange={field.onChange}
                placeholder="Selecciona uno o más cursos"
                disabled={!selectedAsignaturaId || !selectedNivelId}
              />
            )}
          />
          {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm mt-1">{errors.cursoAsignaturaIds.message}</p>}
        </div>

        <div>
          <Label>Vincular a Proyecto ABP (Opcional)</Label>
          <div className="flex gap-2">
            <Controller
                name="proyectoId"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCursoAsignaturaIds || selectedCursoAsignaturaIds.length === 0 || loadingProjects}>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingProjects ? "Cargando proyectos..." : "Selecciona un proyecto"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No vincular a un proyecto</SelectItem>
                            {relevantProjects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            <Button type="button" variant="outline" onClick={openCreateProjectDialog} disabled={!selectedCursoAsignaturaIds || selectedCursoAsignaturaIds.length === 0}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear Proyecto
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="titulo">4. Título de la Unidad</Label>
          <Controller
            name="titulo"
            control={control}
            render={({ field }) => <Input id="titulo" placeholder="Ej: Unidad 2: El Ecosistema y sus Interacciones" {...field} />}
          />
          {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>}
        </div>

        <div>
          <Label>5. Rango de Fechas de la Unidad</Label>
          <Controller
            name="fechas"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value?.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value?.from ? (
                      field.value.to ? (
                        <>
                          {format(field.value.from, "LLL dd, y", { locale: es })} -{" "}
                          {format(field.value.to, "LLL dd, y", { locale: es })}
                        </>
                      ) : (
                        format(field.value.from, "LLL dd, y", { locale: es })
                      )
                    ) : (
                      <span>Selecciona un rango de fechas</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value as DateRange}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.fechas && <p className="text-red-500 text-sm mt-1">{errors.fechas?.from?.message || errors.fechas?.to?.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="descripcionContenidos">6. Contenidos y Temas a Abordar</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleSuggestContent} disabled={isLoading || isSuggestingContent}>
              {isSuggestingContent ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Sugerir
            </Button>
          </div>
          <Controller
            name="descripcionContenidos"
            control={control}
            render={({ field }) => (
              <Textarea
                id="descripcionContenidos"
                placeholder="Describe los temas, conceptos clave y habilidades que quieres desarrollar en esta unidad, o haz clic en 'Sugerir'."
                rows={5}
                {...field}
              />
            )}
          />
          {errors.descripcionContenidos && <p className="text-red-500 text-sm mt-1">{errors.descripcionContenidos.message}</p>}
        </div>

        <div>
          <Label htmlFor="instruccionesAdicionales">7. Instrucciones Adicionales para la IA (Opcional)</Label>
          <Controller
            name="instruccionesAdicionales"
            control={control}
            render={({ field }) => (
              <Textarea
                id="instruccionesAdicionales"
                placeholder="Ej: 'Enfócate en actividades prácticas', 'Incluye una salida a terreno', 'Adapta las primeras 3 clases para estudiantes con apoyo PIE'."
                rows={3}
                {...field}
              />
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading || isSuggestingContent}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generando...' : 'Generar Sugerencias con IA'}
          </Button>
        </div>
      </form>
      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
        initialData={initialProjectData}
      />
    </>
  );
};

export default Step1UnitConfig;
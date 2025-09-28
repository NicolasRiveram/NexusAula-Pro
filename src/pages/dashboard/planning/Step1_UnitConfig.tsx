import React, { useState, useEffect } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MultiSelect } from '@/components/MultiSelect';
import { showError } from '@/utils/toast';

const schema = z.object({
  cursoAsignaturaIds: z.array(z.string()).min(1, "Debes seleccionar al menos un curso."),
  titulo: z.string().min(3, "El título es requerido."),
  fechas: z.object({
    from: z.date({ required_error: "La fecha de inicio es requerida." }),
    to: z.date({ required_error: "La fecha de fin es requerida." }),
  }),
  descripcionContenidos: z.string().min(10, "Describe los contenidos a abordar."),
  instruccionesAdicionales: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CursoParaSeleccion {
  id: string;
  nombre: string;
  nivelId: string;
}

const Step1UnitConfig = () => {
  const { activeEstablishment } = useEstablishment();
  const [cursos, setCursos] = useState<CursoParaSeleccion[]>([]);
  const [niveles, setNiveles] = useState<Record<string, string>>({});
  const [selectedNivel, setSelectedNivel] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedCursos = watch('cursoAsignaturaIds') || [];

  useEffect(() => {
    const fetchCursos = async () => {
      if (!activeEstablishment) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('curso_asignaturas')
        .select('id, cursos!inner(nombre, niveles(id, nombre))')
        .eq('docente_id', user.id)
        .eq('cursos.establecimiento_id', activeEstablishment.id);

      if (error) {
        showError("Error al cargar cursos: " + error.message);
        return;
      }

      const nivelesUnicos: Record<string, string> = {};
      const cursosParaSeleccion = data.map((ca: any) => {
        nivelesUnicos[ca.cursos.niveles.id] = ca.cursos.niveles.nombre;
        return {
          id: ca.id,
          nombre: `${ca.cursos.niveles.nombre} - ${ca.cursos.nombre}`,
          nivelId: ca.cursos.niveles.id,
        };
      });
      
      setCursos(cursosParaSeleccion);
      setNiveles(nivelesUnicos);
    };
    fetchCursos();
  }, [activeEstablishment]);

  const handleNivelChange = (nivelId: string) => {
    setSelectedNivel(nivelId);
    setValue('cursoAsignaturaIds', []); // Resetear cursos al cambiar de nivel
  };

  const onSubmit = (data: FormData) => {
    console.log("Datos de la unidad:", data);
    // Aquí se llamaría a la función de IA y se pasaría al siguiente paso
  };

  const cursosFiltrados = cursos.filter(c => c.nivelId === selectedNivel);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label>1. Selecciona el Nivel</Label>
        <select
          onChange={(e) => handleNivelChange(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">Selecciona un nivel</option>
          {Object.entries(niveles).map(([id, nombre]) => (
            <option key={id} value={id}>{nombre}</option>
          ))}
        </select>
      </div>

      {selectedNivel && (
        <div>
          <Label>2. Selecciona los Cursos para esta Planificación</Label>
          <Controller
            name="cursoAsignaturaIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                options={cursosFiltrados.map(c => ({ value: c.id, label: c.nombre }))}
                selected={field.value || []}
                onValueChange={field.onChange}
                placeholder="Selecciona uno o más cursos"
              />
            )}
          />
          {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm mt-1">{errors.cursoAsignaturaIds.message}</p>}
        </div>
      )}

      <div>
        <Label htmlFor="titulo">3. Título de la Unidad</Label>
        <Controller
          name="titulo"
          control={control}
          render={({ field }) => <Input id="titulo" placeholder="Ej: Unidad 2: El Ecosistema y sus Interacciones" {...field} />}
        />
        {errors.titulo && <p className="text-red-500 text-sm mt-1">{errors.titulo.message}</p>}
      </div>

      <div>
        <Label>4. Rango de Fechas de la Unidad</Label>
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
        <Label htmlFor="descripcionContenidos">5. Contenidos y Temas a Abordar</Label>
        <Controller
          name="descripcionContenidos"
          control={control}
          render={({ field }) => (
            <Textarea
              id="descripcionContenidos"
              placeholder="Describe los temas, conceptos clave y habilidades que quieres desarrollar en esta unidad."
              rows={5}
              {...field}
            />
          )}
        />
        {errors.descripcionContenidos && <p className="text-red-500 text-sm mt-1">{errors.descripcionContenidos.message}</p>}
      </div>

      <div>
        <Label htmlFor="instruccionesAdicionales">6. Instrucciones Adicionales para la IA (Opcional)</Label>
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
        <Button type="submit">
          Generar Sugerencias con IA
        </Button>
      </div>
    </form>
  );
};

export default Step1UnitConfig;
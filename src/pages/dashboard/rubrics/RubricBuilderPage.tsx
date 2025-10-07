import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { createRubric, generateRubricWithAI, saveGeneratedRubricContent, RubricContent } from '@/api/rubricsApi';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { fetchNiveles, fetchDocenteAsignaturas, Nivel, Asignatura } from '@/api/coursesApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const step1Schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  actividad_a_evaluar: z.string().min(3, "La actividad es requerida."),
  descripcion: z.string().min(10, "La descripción debe ser más detallada."),
  categoria: z.string().min(3, "La categoría es requerida."),
  nivelId: z.string().uuid("Debes seleccionar un nivel educativo."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
  cantidadCategorias: z.coerce.number().min(2, "Debe haber al menos 2 categorías.").max(7, "No puedes tener más de 7 categorías."),
  objetivosSugeridos: z.string().optional(),
});

type Step1FormData = z.infer<typeof step1Schema>;

const RubricBuilderPage = () => {
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestingOAs, setIsSuggestingOAs] = useState(false);
  const [rubricId, setRubricId] = useState<string | null>(null);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);

  const { control: step1Control, handleSubmit: handleStep1Submit, formState: { errors: step1Errors }, getValues, setValue } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      cantidadCategorias: 3,
    },
  });

  const { control: step2Control, handleSubmit: handleStep2Submit, reset: resetStep2 } = useForm<{ criterios: RubricContent['criterios'] }>();
  const { fields } = useFieldArray({ control: step2Control, name: "criterios" });

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError("No se pudo identificar al usuario.");
        return;
      }

      try {
        const [nivelesData, asignaturasData] = await Promise.all([
          fetchNiveles(),
          fetchDocenteAsignaturas(user.id)
        ]);
        setNiveles(nivelesData);
        setAsignaturas(asignaturasData);
      } catch (err: any) {
        showError(`Error al cargar datos iniciales: ${err.message}`);
      }
    };
    loadData();
  }, []);

  const handleSuggestOAs = async () => {
    const { nivelId, asignaturaId, descripcion } = getValues();
    if (!nivelId || !asignaturaId || !descripcion) {
      showError("Por favor, selecciona nivel, asignatura y escribe una descripción para sugerir OAs.");
      return;
    }
    setIsSuggestingOAs(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-learning-objectives', {
        body: { nivelId, asignaturaId, tema: descripcion },
      });
      if (error) throw error;
      setValue('objetivosSugeridos', data.suggestions);
      showSuccess("Objetivos de aprendizaje sugeridos.");
    } catch (error: any) {
      showError(`Error al sugerir OAs: ${error.message}`);
    } finally {
      setIsSuggestingOAs(false);
    }
  };

  const onStep1Submit = async (data: Step1FormData) => {
    if (!activeEstablishment) {
      showError("Debes seleccionar un establecimiento activo.");
      return;
    }
    setIsLoading(true);
    try {
      const newRubricId = await createRubric(data.nombre, data.actividad_a_evaluar, data.descripcion, activeEstablishment.id, data.categoria);
      setRubricId(newRubricId);

      const nivelNombre = niveles.find(n => n.id === data.nivelId)?.nombre || '';
      const asignaturaNombre = asignaturas.find(a => a.id === data.asignaturaId)?.nombre || '';

      const aiContent = await generateRubricWithAI({
        activity: data.actividad_a_evaluar,
        description: data.descripcion,
        nivelNombre,
        asignaturaNombre,
        cantidadCategorias: data.cantidadCategorias,
        objetivos: data.objetivosSugeridos || 'No especificados',
      });
      resetStep2({ criterios: aiContent.criterios });
      
      showSuccess("Rúbrica generada por IA. Ahora puedes revisarla y guardarla.");
      setStep(2);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onStep2Submit = async (data: { criterios: RubricContent['criterios'] }) => {
    if (!rubricId) return;
    setIsLoading(true);
    try {
      await saveGeneratedRubricContent(rubricId, { criterios: data.criterios });
      showSuccess("Rúbrica guardada exitosamente.");
      navigate('/dashboard/rubricas');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/rubricas" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Banco de Rúbricas
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Asistente de Creación de Rúbricas</CardTitle>
          <CardDescription>
            {step === 1 ? 'Paso 1: Define la actividad a evaluar.' : 'Paso 2: Revisa y ajusta la rúbrica generada por IA.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <form onSubmit={handleStep1Submit(onStep1Submit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nivelId">Nivel Educativo</Label>
                  <Controller name="nivelId" control={step1Control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                      <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {step1Errors.nivelId && <p className="text-red-500 text-sm mt-1">{step1Errors.nivelId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="asignaturaId">Asignatura</Label>
                  <Controller name="asignaturaId" control={step1Control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                      <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {step1Errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{step1Errors.asignaturaId.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="nombre">Nombre de la Evaluación</Label>
                <Controller name="nombre" control={step1Control} render={({ field }) => <Input id="nombre" {...field} />} />
                {step1Errors.nombre && <p className="text-red-500 text-sm mt-1">{step1Errors.nombre.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actividad_a_evaluar">Actividad a Evaluar</Label>
                  <Controller name="actividad_a_evaluar" control={step1Control} render={({ field }) => <Input id="actividad_a_evaluar" {...field} />} />
                  {step1Errors.actividad_a_evaluar && <p className="text-red-500 text-sm mt-1">{step1Errors.actividad_a_evaluar.message}</p>}
                </div>
                <div>
                  <Label htmlFor="categoria">Categoría</Label>
                  <Controller name="categoria" control={step1Control} render={({ field }) => <Input id="categoria" placeholder="Ej: Trabajos Prácticos, Exposiciones..." {...field} />} />
                  {step1Errors.categoria && <p className="text-red-500 text-sm mt-1">{step1Errors.categoria.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción de la Actividad y Contenidos</Label>
                <Controller name="descripcion" control={step1Control} render={({ field }) => <Textarea id="descripcion" rows={5} {...field} />} />
                {step1Errors.descripcion && <p className="text-red-500 text-sm mt-1">{step1Errors.descripcion.message}</p>}
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="objetivosSugeridos">Objetivos de Aprendizaje</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleSuggestOAs} disabled={isSuggestingOAs}>
                    {isSuggestingOAs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Sugerir OAs
                  </Button>
                </div>
                <Controller name="objetivosSugeridos" control={step1Control} render={({ field }) => <Textarea id="objetivosSugeridos" rows={4} {...field} />} />
              </div>
              <div>
                <Label htmlFor="cantidadCategorias">Cantidad de Criterios/Categorías</Label>
                <Controller name="cantidadCategorias" control={step1Control} render={({ field }) => <Input id="cantidadCategorias" type="number" min="2" max="7" {...field} />} />
                {step1Errors.cantidadCategorias && <p className="text-red-500 text-sm mt-1">{step1Errors.cantidadCategorias.message}</p>}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generando...' : 'Generar Rúbrica con IA'}
                </Button>
              </div>
            </form>
          )}
          {step === 2 && (
            <form onSubmit={handleStep2Submit(onStep2Submit)} className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 w-1/4 align-top text-left">Criterio de Evaluación</th>
                      {fields[0]?.niveles.map((level, levelIndex) => (
                        <th key={levelIndex} className="border p-2 align-top text-left">
                          <Controller name={`criterios.0.niveles.${levelIndex}.nombre`} control={step2Control} render={({ field }) => <Input className="font-bold" {...field} />} />
                          <Controller name={`criterios.0.niveles.${levelIndex}.puntaje`} control={step2Control} render={({ field }) => <Input type="number" className="mt-1" {...field} />} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, criterionIndex) => (
                      <tr key={field.id}>
                        <td className="border p-2 align-top">
                          <Controller name={`criterios.${criterionIndex}.nombre`} control={step2Control} render={({ field }) => <Input className="font-semibold" {...field} />} />
                          <Controller name={`criterios.${criterionIndex}.habilidad`} control={step2Control} render={({ field }) => <Badge variant="secondary" className="mt-2"><Input className="border-none bg-transparent h-auto p-0" {...field} /></Badge>} />
                          <Controller name={`criterios.${criterionIndex}.descripcion`} control={step2Control} render={({ field }) => <Textarea className="mt-2" {...field} />} />
                        </td>
                        {field.niveles.map((level, levelIndex) => (
                          <td key={levelIndex} className="border p-2 align-top">
                            <Controller name={`criterios.${criterionIndex}.niveles.${levelIndex}.descripcion`} control={step2Control} render={({ field }) => <Textarea rows={8} {...field} />} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Rúbrica
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RubricBuilderPage;
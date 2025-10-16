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
import { fetchNiveles, fetchDocenteAsignaturas, Nivel, Asignatura } from '@/api/courses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [rubricId, setRubricId] = useState<string | null>(null);

  const { control: step1Control, handleSubmit: handleStep1Submit, formState: { errors: step1Errors }, getValues, setValue } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      cantidadCategorias: 3,
    },
  });

  const { control: step2Control, handleSubmit: handleStep2Submit, reset: resetStep2 } = useForm<{ criterios: RubricContent['criterios'] }>();
  const { fields } = useFieldArray({ control: step2Control, name: "criterios" });

  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({
    queryKey: ['niveles'],
    queryFn: fetchNiveles,
  });

  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({
    queryKey: ['docenteAsignaturas', user?.id],
    queryFn: () => fetchDocenteAsignaturas(user!.id),
    enabled: !!user,
  });

  const suggestOAsMutation = useMutation({
    mutationFn: async () => {
      const { nivelId, asignaturaId, descripcion } = getValues();
      if (!nivelId || !asignaturaId || !descripcion) {
        throw new Error("Por favor, selecciona nivel, asignatura y escribe una descripción para sugerir OAs.");
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase.functions.invoke('suggest-learning-objectives', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { nivelId, asignaturaId, tema: descripcion },
      });
      if (error) throw error;
      return data.suggestions;
    },
    onSuccess: (suggestions) => {
      setValue('objetivosSugeridos', suggestions);
      showSuccess("Objetivos de aprendizaje sugeridos.");
    },
    onError: (error: any) => {
      showError(`Error al sugerir OAs: ${error.message}`);
    }
  });

  const step1Mutation = useMutation({
    mutationFn: async (data: Step1FormData) => {
      if (!activeEstablishment) throw new Error("Debes seleccionar un establecimiento activo.");
      
      const newRubricId = await createRubric(data.nombre, data.actividad_a_evaluar, data.descripcion, activeEstablishment.id, data.categoria);
      setRubricId(newRubricId);

      const nivelNombre = niveles.find(n => n.id === data.nivelId)?.nombre || '';
      const asignaturaNombre = asignaturas.find(a => a.id === data.asignaturaId)?.nombre || '';

      return await generateRubricWithAI({
        activity: data.actividad_a_evaluar,
        description: data.descripcion,
        nivelNombre,
        asignaturaNombre,
        cantidadCategorias: data.cantidadCategorias,
        objetivos: data.objetivosSugeridos || 'No especificados',
      });
    },
    onSuccess: (aiContent) => {
      resetStep2({ criterios: aiContent.criterios });
      showSuccess("Rúbrica generada por IA. Ahora puedes revisarla y guardarla.");
      setStep(2);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const step2Mutation = useMutation({
    mutationFn: (data: { criterios: RubricContent['criterios'] }) => {
      if (!rubricId) throw new Error("No se encontró el ID de la rúbrica.");
      return saveGeneratedRubricContent(rubricId, { criterios: data.criterios });
    },
    onSuccess: () => {
      showSuccess("Rúbrica guardada exitosamente.");
      navigate('/dashboard/rubricas');
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const isLoading = step1Mutation.isPending || step2Mutation.isPending;

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
            <form onSubmit={handleStep1Submit((data) => step1Mutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nivelId">Nivel Educativo</Label>
                  <Controller name="nivelId" control={step1Control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingNiveles}>
                      <SelectTrigger><SelectValue placeholder={isLoadingNiveles ? "Cargando..." : "Selecciona un nivel"} /></SelectTrigger>
                      <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )} />
                  {step1Errors.nivelId && <p className="text-red-500 text-sm mt-1">{step1Errors.nivelId.message}</p>}
                </div>
                <div>
                  <Label htmlFor="asignaturaId">Asignatura</Label>
                  <Controller name="asignaturaId" control={step1Control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingAsignaturas}>
                      <SelectTrigger><SelectValue placeholder={isLoadingAsignaturas ? "Cargando..." : "Selecciona una asignatura"} /></SelectTrigger>
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
                  <Button type="button" variant="outline" size="sm" onClick={() => suggestOAsMutation.mutate()} disabled={suggestOAsMutation.isPending}>
                    {suggestOAsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
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
            <form onSubmit={handleStep2Submit((data) => step2Mutation.mutate(data))} className="space-y-6">
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
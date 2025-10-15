import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';
import { fetchNiveles, fetchAsignaturas, Nivel, Asignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import GeneratorResultsComponent from '@/components/super-admin/expert-generator/GeneratorResultsComponent';
import { useQuery, useMutation } from '@tanstack/react-query';

const schema = z.object({
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
});

type FormData = z.infer<typeof schema>;

const ExpertGeneratorPage = () => {
  const [results, setResults] = useState<any | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ nivelId: string; asignaturaId: string } | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({
    queryKey: ['nivelesForGenerator'],
    queryFn: fetchNiveles,
    onError: (error: any) => showError(`Error al cargar niveles: ${error.message}`),
  });

  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({
    queryKey: ['asignaturasForGenerator'],
    queryFn: fetchAsignaturas,
    onError: (error: any) => showError(`Error al cargar asignaturas: ${error.message}`),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: resultData, error } = await supabase.functions.invoke('expert-curriculum-simulator', {
        body: {
          nivelId: data.nivelId,
          asignaturaId: data.asignaturaId,
        },
      });
      if (error) throw error;
      return resultData;
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error: any) => {
      showError(`Error al generar la simulación: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    setResults(null);
    setCurrentSelection({ nivelId: data.nivelId, asignaturaId: data.asignaturaId });
    mutation.mutate(data);
  };

  const loadingOptions = isLoadingNiveles || isLoadingAsignaturas;

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generador Experto: Simulador Curricular</CardTitle>
          <CardDescription>
            Selecciona un nivel y una asignatura para que la IA genere una propuesta completa de componentes curriculares para su revisión y entrenamiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nivel Educativo</Label>
                <Controller
                  name="nivelId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingOptions}>
                      <SelectTrigger><SelectValue placeholder={loadingOptions ? "Cargando..." : "Selecciona un nivel"} /></SelectTrigger>
                      <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message}</p>}
              </div>
              <div>
                <Label>Asignatura</Label>
                <Controller
                  name="asignaturaId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingOptions}>
                      <SelectTrigger><SelectValue placeholder={loadingOptions ? "Cargando..." : "Selecciona una asignatura"} /></SelectTrigger>
                      <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{errors.asignaturaId.message}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending || loadingOptions}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {mutation.isPending ? 'Generando...' : 'Generar Simulación'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {mutation.isPending && (
        <div className="flex flex-col items-center justify-center text-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold">La IA está procesando tu solicitud...</p>
          <p className="text-muted-foreground">Esto puede tardar unos segundos.</p>
        </div>
      )}

      {results && currentSelection && <GeneratorResultsComponent results={results} selection={currentSelection} />}
    </div>
  );
};

export default ExpertGeneratorPage;
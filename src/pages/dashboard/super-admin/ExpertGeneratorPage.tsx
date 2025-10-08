import React, { useState, useEffect } from 'react';
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

const schema = z.object({
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
});

type FormData = z.infer<typeof schema>;

const ExpertGeneratorPage = () => {
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [currentSelection, setCurrentSelection] = useState<{ nivelId: string; asignaturaId: string } | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [nivelesData, asignaturasData] = await Promise.all([
          fetchNiveles(),
          fetchAsignaturas(),
        ]);
        setNiveles(nivelesData);
        setAsignaturas(asignaturasData);
      } catch (error: any) {
        showError(`Error al cargar opciones: ${error.message}`);
      }
    };
    loadOptions();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setResults(null);
    setCurrentSelection({ nivelId: data.nivelId, asignaturaId: data.asignaturaId });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión de usuario activa.");

      const { data: resultData, error } = await supabase.functions.invoke('expert-curriculum-simulator', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          nivelId: data.nivelId,
          asignaturaId: data.asignaturaId,
        },
      });
      if (error) throw error;
      setResults(resultData);
    } catch (error: any) {
      showError(`Error al generar la simulación: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                      <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                />
                {errors.asignaturaId && <p className="text-red-500 text-sm mt-1">{errors.asignaturaId.message}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {loading ? 'Generando...' : 'Generar Simulación'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading && (
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
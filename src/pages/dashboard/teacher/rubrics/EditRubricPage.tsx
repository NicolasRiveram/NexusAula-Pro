import React from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { fetchRubricById, updateRubric } from '@/api/rubricsApi';
import { showError, showSuccess } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const rubricSchema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  actividad_a_evaluar: z.string().min(3, "La actividad es requerida."),
  descripcion: z.string().min(10, "La descripción debe ser más detallada."),
  categoria: z.string().min(3, "La categoría es requerida.").optional(),
  contenido_json: z.object({
    criterios: z.array(z.object({
      nombre: z.string().min(1),
      habilidad: z.string().min(1),
      descripcion: z.string().min(1),
      niveles: z.array(z.object({
        puntaje: z.coerce.number(),
        nombre: z.string().min(1),
        descripcion: z.string().min(1),
      })),
    })),
  }),
});

type RubricFormData = z.infer<typeof rubricSchema>;

const EditRubricPage = () => {
  const navigate = useNavigate();
  const { rubricId } = useParams<{ rubricId: string }>();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<RubricFormData>({
    resolver: zodResolver(rubricSchema),
  });
  const { fields } = useFieldArray({ control, name: "contenido_json.criterios" });

  const { isLoading: isLoadingRubric } = useQuery({
    queryKey: ['rubric', rubricId],
    queryFn: () => fetchRubricById(rubricId!),
    enabled: !!rubricId,
    onSuccess: (data) => {
      reset({
        nombre: data.nombre,
        actividad_a_evaluar: data.actividad_a_evaluar,
        descripcion: data.descripcion,
        categoria: data.categoria || '',
        contenido_json: data.contenido_json || { criterios: [] },
      });
    },
    onError: (err: any) => {
      showError(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: RubricFormData) => updateRubric(rubricId!, data as any),
    onSuccess: () => {
      showSuccess("Rúbrica actualizada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['rubric', rubricId] });
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      navigate(`/dashboard/rubricas/${rubricId}`);
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const onSubmit = (data: RubricFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoadingRubric) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <Link to={`/dashboard/rubricas/${rubricId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la Rúbrica
      </Link>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Editar Rúbrica</CardTitle>
            <CardDescription>Modifica los detalles y el contenido de la rúbrica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre de la Evaluación</Label>
              <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
              {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actividad_a_evaluar">Actividad a Evaluar</Label>
                <Controller name="actividad_a_evaluar" control={control} render={({ field }) => <Input id="actividad_a_evaluar" {...field} />} />
                {errors.actividad_a_evaluar && <p className="text-red-500 text-sm mt-1">{errors.actividad_a_evaluar.message}</p>}
              </div>
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Controller name="categoria" control={control} render={({ field }) => <Input id="categoria" placeholder="Ej: Trabajos Prácticos, Exposiciones..." {...field} />} />
                {errors.categoria && <p className="text-red-500 text-sm mt-1">{errors.categoria.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="descripcion">Descripción de la Actividad</Label>
              <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" rows={3} {...field} />} />
              {errors.descripcion && <p className="text-red-500 text-sm mt-1">{errors.descripcion.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Contenido de la Rúbrica</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr>
                  <th className="border p-2 w-1/4 align-top text-left">Criterio de Evaluación</th>
                  {fields[0]?.niveles.map((level, levelIndex) => (
                    <th key={levelIndex} className="border p-2 align-top text-left">
                      <Controller name={`contenido_json.criterios.0.niveles.${levelIndex}.nombre`} control={control} render={({ field }) => <Input className="font-bold" {...field} />} />
                      <Controller name={`contenido_json.criterios.0.niveles.${levelIndex}.puntaje`} control={control} render={({ field }) => <Input type="number" className="mt-1" {...field} />} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map((field, criterionIndex) => (
                  <tr key={field.id}>
                    <td className="border p-2 align-top">
                      <Controller name={`contenido_json.criterios.${criterionIndex}.nombre`} control={control} render={({ field }) => <Input className="font-semibold" {...field} />} />
                      <Controller name={`contenido_json.criterios.${criterionIndex}.habilidad`} control={control} render={({ field }) => <Badge variant="secondary" className="mt-2"><Input className="border-none bg-transparent h-auto p-0" {...field} /></Badge>} />
                      <Controller name={`contenido_json.criterios.${criterionIndex}.descripcion`} control={control} render={({ field }) => <Textarea className="mt-2" {...field} />} />
                    </td>
                    {field.niveles.map((level, levelIndex) => (
                      <td key={levelIndex} className="border p-2 align-top">
                        <Controller name={`contenido_json.criterios.${criterionIndex}.niveles.${levelIndex}.descripcion`} control={control} render={({ field }) => <Textarea rows={8} {...field} />} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditRubricPage;
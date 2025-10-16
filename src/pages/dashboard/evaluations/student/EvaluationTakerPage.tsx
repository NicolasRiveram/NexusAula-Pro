import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { fetchEvaluationDetails, submitEvaluationResponse, fetchStudentResponseForEvaluation, getPublicImageUrl } from '@/api/evaluationsApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, Target } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const EvaluationTakerPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { control, handleSubmit, formState: { isSubmitting } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['evaluationTakerData', evaluationId, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado.");
      const [evalData, existingResponse] = await Promise.all([
        fetchEvaluationDetails(evaluationId!),
        fetchStudentResponseForEvaluation(evaluationId!, user.id)
      ]);
      return { evaluation: evalData, existingResponseId: existingResponse?.id || null };
    },
    enabled: !!evaluationId && !!user,
    onError: (error: any) => showError(`Error al cargar la evaluación: ${error.message}`),
  });

  const { evaluation, existingResponseId } = data || {};

  const mutation = useMutation({
    mutationFn: (answers: { itemId: string; selectedAlternativeId: string }[]) => submitEvaluationResponse(evaluationId!, answers),
    onSuccess: () => {
      showSuccess("Evaluación enviada con éxito.");
      navigate(`/dashboard/evaluacion/${evaluationId}/resultados`);
    },
    onError: (error: any) => {
      showError(`Error al enviar: ${error.message}`);
    }
  });

  const onSubmit = (formData: any) => {
    const answers = Object.entries(formData).map(([itemId, selectedAlternativeId]) => ({
      itemId,
      selectedAlternativeId: selectedAlternativeId as string,
    }));

    if (answers.length !== evaluation?.evaluation_content_blocks.flatMap(b => b.evaluacion_items).length) {
        showError("Debes responder todas las preguntas antes de enviar.");
        return;
    }
    mutation.mutate(answers);
  };

  if (isLoading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (existingResponseId) {
    return (
      <div className="container mx-auto text-center py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center"><CheckCircle className="h-6 w-6 mr-2 text-green-500" /> Ya completaste esta evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Tus respuestas han sido registradas. Puedes ver los resultados una vez que tu profesor los publique.</p>
            <Button asChild className="mt-4">
              <Link to="/dashboard">Volver al Inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!evaluation) {
    return <div className="container mx-auto text-center"><p>No se pudo encontrar la evaluación.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{evaluation.titulo}</CardTitle>
          <CardDescription>{evaluation.descripcion}</CardDescription>
        </CardHeader>
        {evaluation.estandar_esperado && (
          <CardContent>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <h3 className="font-semibold flex items-center text-blue-800 dark:text-blue-300"><Target className="h-5 w-5 mr-2" /> Objetivo de la Evaluación</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300/90 mt-2">{evaluation.estandar_esperado}</p>
            </div>
          </CardContent>
        )}
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {evaluation.evaluation_content_blocks.map(block => (
          <Card key={block.id}>
            <CardContent className="pt-6 space-y-6">
              {block.visible_en_evaluacion && (
                block.block_type === 'text' ? (
                  <p className="text-base whitespace-pre-wrap p-4 bg-muted/50 rounded-md">{block.content.text}</p>
                ) : (
                  <img src={getPublicImageUrl(block.content.imageUrl)} alt={`Contenido ${block.orden}`} className="rounded-md max-w-full mx-auto" />
                )
              )}

              {block.evaluacion_items.map(item => (
                <div key={item.id} className="p-4 border-t">
                  <p className="font-semibold">{item.orden}. {item.enunciado}</p>
                  <Controller
                    name={item.id}
                    control={control}
                    rules={{ required: "Esta pregunta es obligatoria." }}
                    render={({ field, fieldState }) => (
                      <>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="mt-4 space-y-2">
                          {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => (
                            <div key={alt.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={alt.id} id={alt.id} />
                              <Label htmlFor={alt.id} className="font-normal">{String.fromCharCode(97 + index)}) {alt.texto}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {fieldState.error && <p className="text-red-500 text-sm mt-2">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Evaluación
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EvaluationTakerPage;
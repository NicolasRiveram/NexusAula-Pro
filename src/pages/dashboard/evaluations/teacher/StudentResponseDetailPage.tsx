import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, fetchStudentAndEvaluationInfo, StudentResponseHeader, fetchStudentResponseDetails, StudentResponseItem } from '@/api/evaluations';
import { showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const StudentResponseDetailPage = () => {
  const { evaluationId, responseId } = useParams<{ evaluationId: string; responseId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [responseHeader, setResponseHeader] = useState<StudentResponseHeader | null>(null);
  const [responseDetails, setResponseDetails] = useState<StudentResponseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (evaluationId && responseId) {
      setLoading(true);
      Promise.all([
        fetchEvaluationDetails(evaluationId),
        fetchStudentAndEvaluationInfo(responseId),
        fetchStudentResponseDetails(responseId)
      ]).then(([evalData, headerData, detailsData]) => {
        setEvaluation(evalData);
        setResponseHeader(headerData);
        setResponseDetails(detailsData);
      }).catch(err => {
        showError(`Error al cargar la revisión: ${err.message}`);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [evaluationId, responseId]);

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!evaluation || !responseHeader) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo cargar la información de la respuesta.</p>
      </div>
    );
  }

  const totalPuntajeObtenido = responseDetails.reduce((sum, item) => sum + item.puntaje_item_obtenido, 0);
  const totalPuntajeMaximo = evaluation.evaluation_content_blocks.reduce((total, block) => {
    return total + block.evaluacion_items.reduce((blockTotal, item) => blockTotal + item.puntaje, 0);
  }, 0);

  return (
    <div className="container mx-auto space-y-6">
      <Link to={`/dashboard/evaluacion/${evaluationId}/resultados`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a Resultados
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Revisión de: {responseHeader.evaluation_title}</CardTitle>
          <CardDescription>
            Mostrando las respuestas de <span className="font-semibold">{responseHeader.student_name}</span>.
            Puntaje Obtenido: {totalPuntajeObtenido} / {totalPuntajeMaximo}
          </CardDescription>
        </CardHeader>
      </Card>

      {evaluation.evaluation_content_blocks.map(block => (
        <Card key={block.id}>
          <CardHeader>
            <CardTitle className="text-lg">Sección {block.orden}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {block.evaluacion_items.map(item => {
              const studentResponse = responseDetails.find(r => r.evaluacion_item_id === item.id);
              return (
                <div key={item.id}>
                  <div className="flex justify-between items-start">
                    <p className="font-semibold">{item.orden}. {item.enunciado}</p>
                    <Badge variant="outline">{studentResponse?.puntaje_item_obtenido || 0} / {item.puntaje} pts.</Badge>
                  </div>
                  {item.tipo_item === 'seleccion_multiple' && (
                    <ul className="mt-2 space-y-2 text-sm pl-5">
                      {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => {
                        const isSelected = studentResponse?.alternativa_seleccionada_id === alt.id;
                        const isCorrect = alt.es_correcta;
                        return (
                          <li key={alt.id} className={cn("flex items-center p-2 rounded-md", isSelected && "bg-blue-100 dark:bg-blue-900/30")}>
                            <span className="mr-2">{String.fromCharCode(97 + index)})</span>
                            <span className={cn(isCorrect && "font-bold")}>{alt.texto}</span>
                            {isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-green-600" />}
                            {isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-auto text-destructive" />}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <Separator className="my-4" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StudentResponseDetailPage;
import React, { useState, useRef, useEffect } from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EvaluationDetail, EvaluationItem, replaceEvaluationResponse, fetchStudentResponseForEvaluation, fetchStudentResponseDetails } from '@/api/evaluationsApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface StudentAnswerRowProps {
  student: { id: string; nombre_completo: string };
  evaluation: EvaluationDetail;
  questions: EvaluationItem[];
  shuffledAlternativesMap: { [questionId: string]: any[] };
}

const StudentAnswerRow: React.FC<StudentAnswerRowProps> = ({ student, evaluation, questions, shuffledAlternativesMap }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'pending' | 'saving' | 'saved' | 'error'>('pending');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, questions.length);
  }, [questions]);

  useEffect(() => {
    const loadExistingAnswers = async () => {
      try {
        const response = await fetchStudentResponseForEvaluation(evaluation.id, student.id);
        if (response) {
          const details = await fetchStudentResponseDetails(response.id);
          const loadedAnswers: Record<string, string> = {};
          details.forEach(detail => {
            const question = questions.find(q => q.id === detail.evaluacion_item_id);
            if (question) {
              const shuffledAlts = shuffledAlternativesMap[question.id];
              const selectedIndex = shuffledAlts?.findIndex(alt => alt.id === detail.alternativa_seleccionada_id);
              if (selectedIndex !== -1) {
                loadedAnswers[question.id] = String.fromCharCode(97 + selectedIndex);
              }
            }
          });
          setAnswers(loadedAnswers);
          setStatus('saved');
        } else {
          setAnswers({});
          setStatus('pending');
        }
      } catch (error) {
        // No need to show error, just means no previous answers
        setAnswers({});
        setStatus('pending');
      }
    };
    loadExistingAnswers();
  }, [evaluation.id, student.id, questions, shuffledAlternativesMap]);

  const handleInputChange = (itemId: string, index: number, value: string) => {
    const lastChar = value.slice(-1).toLowerCase();
    let finalValue = '';

    if (['a', 'b', 'c', 'd', 'e'].includes(lastChar)) {
      finalValue = lastChar;
    } else if (['1', '2', '3', '4', '5'].includes(lastChar)) {
      finalValue = String.fromCharCode(96 + parseInt(lastChar, 10));
    }

    const question = questions.find(q => q.id === itemId);
    const maxAlternatives = question?.item_alternativas.length || 0;
    if (finalValue.charCodeAt(0) - 97 >= maxAlternatives) {
      finalValue = ''; // Invalid if 'd' is entered for a 3-alternative question
    }

    setAnswers(prev => ({ ...prev, [itemId]: finalValue }));
    setStatus('pending');

    if (finalValue && index < questions.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    const toastId = showLoading(`Guardando respuestas de ${student.nombre_completo}...`);
    try {
      const answersToSubmit = questions.map(q => {
        const answerLetter = answers[q.id];
        if (!answerLetter) {
          throw new Error(`Falta la respuesta para la pregunta ${q.orden}.`);
        }
        const answerIndex = answerLetter.charCodeAt(0) - 97;
        const shuffledAlts = shuffledAlternativesMap[q.id];
        if (!shuffledAlts || !shuffledAlts[answerIndex]) {
          throw new Error(`Alternativa inválida para la pregunta ${q.orden}.`);
        }
        return {
          itemId: q.id,
          selectedAlternativeId: shuffledAlts[answerIndex].id,
        };
      });

      await replaceEvaluationResponse(evaluation.id, answersToSubmit, student.id);
      dismissToast(toastId);
      showSuccess(`Respuestas de ${student.nombre_completo} guardadas.`);
      setStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['evaluationResultsSummary', evaluation.id] });
      queryClient.invalidateQueries({ queryKey: ['evaluationStatistics', evaluation.id] });
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
      setStatus('error');
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">{student.nombre_completo}</TableCell>
      {questions.map((q, index) => (
        <TableCell key={q.id}>
          <Input
            ref={el => inputRefs.current[index] = el}
            value={answers[q.id] || ''}
            onChange={(e) => handleInputChange(q.id, index, e.target.value)}
            className="w-12 h-8 text-center uppercase"
            maxLength={1}
          />
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-card z-10 border-l text-center">
        {status === 'pending' && <Button size="sm" onClick={handleSave}>Guardar</Button>}
        {status === 'saving' && <Button size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>}
        {status === 'saved' && <CheckCircle className="h-6 w-6 text-green-500 mx-auto" />}
        {status === 'error' && <Button size="sm" variant="destructive" onClick={handleSave}><AlertTriangle className="h-4 w-4 mr-2" /> Reintentar</Button>}
      </TableCell>
    </TableRow>
  );
};

export default StudentAnswerRow;
import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fetchEvaluationDetails, EvaluationDetail } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { generateBalancedShuffledAlternatives } from '@/utils/shuffleUtils';
import { Switch } from '@/components/ui/switch';

const schema = z.object({
  rows: z.coerce.number().min(1, "Debe haber al menos 1 fila.").max(2, "Máximo 2 filas."),
  seed: z.string().min(3, "La semilla debe tener al menos 3 caracteres."),
});

type FormData = z.infer<typeof schema>;

interface AnswerKey {
  [rowLabel: string]: {
    [questionNumber: number]: string;
  };
}

interface AnswerKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string | null;
}

const AnswerKeyDialog: React.FC<AnswerKeyDialogProps> = ({ isOpen, onClose, evaluationId }) => {
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [usePieVersion, setUsePieVersion] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen && evaluationId) {
      setLoading(true);
      fetchEvaluationDetails(evaluationId)
        .then(data => {
          setEvaluation(data);
          reset({
            rows: 1,
            seed: `eval-${evaluationId.substring(0, 8)}`,
          });
        })
        .catch(err => showError(`Error al cargar la pauta: ${err.message}`))
        .finally(() => setLoading(false));
    } else {
      setEvaluation(null);
      setAnswerKey(null);
      setUsePieVersion(false);
      reset({ rows: 1, seed: 'nexus-2024' });
    }
  }, [isOpen, evaluationId, reset]);

  const generateKey = (data: FormData) => {
    if (!evaluation) return;

    const allItems = evaluation.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
    const newKey: AnswerKey = {};

    for (let i = 0; i < data.rows; i++) {
      const rowLabel = String.fromCharCode(65 + i);
      newKey[rowLabel] = {};

      const itemsToProcess = allItems.map(item => {
        const adaptation = usePieVersion && item.tiene_adaptacion_pie && item.adaptaciones_pie?.[0];
        return {
          ...item,
          item_alternativas: adaptation ? adaptation.alternativas_adaptadas : item.item_alternativas
        };
      });

      const balancedAlternativesMap = generateBalancedShuffledAlternatives(itemsToProcess, data.seed, rowLabel);

      itemsToProcess.forEach(item => {
        if (item.tipo_item === 'seleccion_multiple') {
          const shuffledAlts = balancedAlternativesMap[item.id];
          const correctIndex = shuffledAlts.findIndex(alt => alt.es_correcta);
          if (correctIndex !== -1) {
            newKey[rowLabel][item.orden] = String.fromCharCode(65 + correctIndex);
          }
        } else if (item.tipo_item === 'verdadero_falso') {
            const correctAnswer = item.item_alternativas.find(alt => alt.es_correcta)?.texto;
            newKey[rowLabel][item.orden] = correctAnswer === 'Verdadero' ? 'V' : 'F';
        } else {
            newKey[rowLabel][item.orden] = 'Abierta';
        }
      });
    }
    setAnswerKey(newKey);
  };

  const questions = useMemo(() => {
    if (!answerKey) return [];
    return Array.from(new Set(Object.values(answerKey).flatMap(row => Object.keys(row).map(Number)))).sort((a, b) => a - b);
  }, [answerKey]);

  const rows = useMemo(() => answerKey ? Object.keys(answerKey).sort() : [], [answerKey]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generar Pauta de Respuestas</DialogTitle>
          <DialogDescription>
            Introduce los mismos parámetros que usaste al imprimir para generar la pauta de corrección correspondiente.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
          <>
            <form onSubmit={handleSubmit(generateKey)} className="space-y-4 py-4 border-b">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rows">Número de Filas (Versiones)</Label>
                  <Controller
                    name="rows"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2].map(num => <SelectItem key={num} value={String(num)}>{num} Fila{num > 1 ? 's' : ''}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rows && <p className="text-red-500 text-sm mt-1">{errors.rows.message}</p>}
                </div>
                <div>
                  <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
                  <Controller name="seed" control={control} render={({ field }) => <Input id="seed" {...field} />} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Introduce <strong>exactamente la misma palabra clave</strong> que usaste al imprimir.
                  </p>
                  {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed.message}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="pie-version" checked={usePieVersion} onCheckedChange={setUsePieVersion} />
                <Label htmlFor="pie-version">Generar pauta para la versión PIE</Label>
              </div>
              <div className="flex justify-end">
                <Button type="submit">Generar Pauta</Button>
              </div>
            </form>

            {answerKey && (
              <ScrollArea className="max-h-[40vh] mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pregunta</TableHead>
                      {rows.map(row => <TableHead key={row} className="text-center">Fila {row}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map(qNum => (
                      <TableRow key={qNum}>
                        <TableCell className="font-medium">{qNum}</TableCell>
                        {rows.map(row => (
                          <TableCell key={row} className="text-center font-bold">{answerKey[row][qNum] || '-'}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnswerKeyDialog;
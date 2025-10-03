import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { fetchEvaluationDetails, EvaluationDetail } from '@/api/evaluationsApi';
import { showError } from '@/utils/toast';
import { Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnswerKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: string | null;
}

const AnswerKeyDialog: React.FC<AnswerKeyDialogProps> = ({ isOpen, onClose, evaluationId }) => {
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && evaluationId) {
      setLoading(true);
      fetchEvaluationDetails(evaluationId)
        .then(setEvaluation)
        .catch(err => showError(`Error al cargar la pauta: ${err.message}`))
        .finally(() => setLoading(false));
    } else {
      setEvaluation(null);
    }
  }, [isOpen, evaluationId]);

  const allItems = evaluation?.evaluation_content_blocks.flatMap(b => b.evaluacion_items) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pauta de Respuestas Correctas</DialogTitle>
          <DialogDescription>
            {evaluation?.titulo || 'Cargando...'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : allItems.length > 0 ? (
            <div className="space-y-6 my-4">
              {allItems.map(item => (
                <div key={item.id}>
                  <p className="font-semibold">{item.orden}. {item.enunciado}</p>
                  {item.tipo_item === 'seleccion_multiple' && (
                    <ul className="mt-2 space-y-1 text-sm pl-5">
                      {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => (
                        <li key={alt.id} className={cn("flex items-center", alt.es_correcta && "font-bold text-green-600")}>
                          {alt.es_correcta && <CheckCircle className="h-4 w-4 mr-2" />}
                          <span>{String.fromCharCode(97 + index)}) {alt.texto}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {item.tipo_item === 'verdadero_falso' && (
                     <p className="mt-2 text-sm font-bold text-green-600 flex items-center pl-5">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {item.item_alternativas.find(alt => alt.es_correcta)?.texto || 'No especificado'}
                     </p>
                  )}
                  {item.tipo_item === 'desarrollo' && (
                    <p className="mt-2 text-sm text-muted-foreground pl-5">Respuesta abierta / de desarrollo.</p>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Esta evaluación no tiene preguntas para mostrar una pauta.</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnswerKeyDialog;
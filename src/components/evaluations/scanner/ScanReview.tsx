import React, { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EvaluationDetail } from '@/api/evaluationsApi';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ScanReviewProps {
  imageData: ImageData;
  evaluation: EvaluationDetail;
  processedAnswers: {
    itemId: string;
    selectedAlternativeId: string;
    isCorrect: boolean;
    questionOrder: number;
    selectedIndex: number;
    alternativesCount: number;
  }[] | null;
  score: number;
  total: number;
  grade: number;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isAnalyzing: boolean;
}

const ScanReview: React.FC<ScanReviewProps> = ({
  imageData,
  evaluation,
  processedAnswers,
  score,
  total,
  grade,
  studentName,
  onConfirm,
  onCancel,
  isAnalyzing,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && imageData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);

        if (isAnalyzing) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 48px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Analizando...', canvas.width / 2, canvas.height / 2);
        } else if (processedAnswers) {
          const questionsPerColumn = Math.ceil(processedAnswers.length / 3);
          const colWidth = 230;
          const rowHeight = 28;
          const startX = 60;
          const startY = 380;
          const bubbleOffsetX = 22.5;
          const bubbleOffsetY = 14;

          processedAnswers.forEach(answer => {
            const colIndex = Math.floor((answer.questionOrder - 1) / questionsPerColumn);
            const rowIndex = (answer.questionOrder - 1) % questionsPerColumn;
            
            const bubbleX = startX + colIndex * colWidth + answer.selectedIndex * 45 + bubbleOffsetX;
            const bubbleY = startY + rowIndex * rowHeight + bubbleOffsetY;

            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (answer.isCorrect) {
              ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
              ctx.fillText('✓', bubbleX, bubbleY);
            } else {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
              ctx.fillText('✗', bubbleX, bubbleY);
            }
          });
        }
      }
    }
  }, [imageData, processedAnswers, isAnalyzing]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revisar Corrección</CardTitle>
        <CardDescription>
          Resultados para <span className="font-bold">{studentName}</span> en la evaluación "{evaluation.titulo}".
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAnalyzing && (
          <div className="flex justify-around items-center p-4 bg-muted rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Puntaje</p>
              <p className="text-2xl font-bold">{score} / {total}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Calificación (60%)</p>
              <p className={cn("text-2xl font-bold", grade < 4.0 ? "text-destructive" : "text-green-600")}>
                {grade.toFixed(1)}
              </p>
            </div>
          </div>
        )}
        <div className="w-full overflow-x-auto border rounded-md bg-gray-100 dark:bg-gray-800">
          <canvas ref={canvasRef} className="max-w-none" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isAnalyzing}>Cancelar y Escanear de Nuevo</Button>
          <Button onClick={onConfirm} disabled={isAnalyzing}>
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar y Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanReview;
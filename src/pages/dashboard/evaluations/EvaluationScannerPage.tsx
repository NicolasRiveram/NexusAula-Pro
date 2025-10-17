import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, CheckCircle, Loader2, XCircle, X } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, submitEvaluationResponse, fetchStudentsForEvaluation, replaceEvaluationResponse } from '@/api/evaluationsApi';
import { seededShuffle } from '@/utils/shuffleUtils';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import ScannerOverlay from '@/components/evaluations/scanner/ScannerOverlay';
import { getPerspectiveTransform, warpPerspective } from '@/utils/perspective';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ScanReview from '@/components/evaluations/scanner/ScanReview';
import { calculateGrade } from '@/utils/evaluationUtils';

const EvaluationScannerPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [students, setStudents] = useState<{ id: string; nombre_completo: string }[]>([]);
  const [seed, setSeed] = useState('nexus-2024');
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<{ studentName: string; message: string; isError: boolean; score?: string; responseId?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [scanMode, setScanMode] = useState<'qr' | 'align'>('qr');
  const [scannedQrData, setScannedQrData] = useState<string | null>(null);
  const [lockedStudentInfo, setLockedStudentInfo] = useState<{ studentName: string; evalTitle: string } | null>(null);

  const [isOverwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false);
  const [overwritePayload, setOverwritePayload] = useState<{ answers: { itemId: string; selectedAlternativeId: string }[] } | null>(null);

  const [reviewData, setReviewData] = useState<any | null>(null);

  useEffect(() => {
    if (evaluationId) {
      Promise.all([
        fetchEvaluationDetails(evaluationId),
        fetchStudentsForEvaluation(evaluationId)
      ]).then(([evalData, studentData]) => {
        setEvaluation(evalData);
        setStudents(studentData.map(s => ({ id: s.id, nombre_completo: s.nombre_completo })));
      }).catch(err => showError(`Error al cargar datos: ${err.message}`));
    }
  }, [evaluationId]);

  const resetScanner = () => {
    setScannerOpen(false);
    setScanMode('qr');
    setScannedQrData(null);
    setLockedStudentInfo(null);
    setIsProcessing(false);
    setReviewData(null);
  };

  const handleQrScanned = (qrData: string) => {
    if (isProcessing || !evaluation) return;
    
    const [evalId, studentId, rowLabel] = qrData.split('|');
    
    if (evalId !== evaluationId) {
      showError("El código QR no corresponde a esta evaluación.");
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (!student) {
      showError("Estudiante no encontrado en este curso.");
      return;
    }

    setScannedQrData(qrData);
    setLockedStudentInfo({ studentName: student.nombre_completo, evalTitle: evaluation.titulo });
    setScanMode('align');
  };

  const getBubbleDarkness = (imageData: ImageData, cx: number, cy: number, radius: number) => {
    let totalBrightness = 0;
    let pixelCount = 0;
    const startX = Math.max(0, Math.floor(cx - radius));
    const startY = Math.max(0, Math.floor(cy - radius));
    const endX = Math.min(imageData.width, Math.ceil(cx + radius));
    const endY = Math.min(imageData.height, Math.ceil(cy + radius));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (Math.pow(x - cx, 2) + Math.pow(y - cy, 2) <= Math.pow(radius, 2)) {
          const i = (y * imageData.width + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i + 1];
          const b = imageData.data[i + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += brightness;
          pixelCount++;
        }
      }
    }
    return pixelCount > 0 ? totalBrightness / pixelCount : 255;
  };

  const processAndSubmit = async (submitFunction: typeof submitEvaluationResponse | typeof replaceEvaluationResponse, answers: { itemId: string; selectedAlternativeId: string }[]) => {
    const responseId = await submitFunction(evaluationId!, answers);
    dismissToast();
    showSuccess(`Respuestas de ${lockedStudentInfo?.studentName} guardadas.`);
    setScanResult({ studentName: lockedStudentInfo!.studentName, message: 'Respuestas guardadas con éxito.', isError: false, score: `${answers.length}/${evaluation!.evaluation_content_blocks.flatMap(b => b.evaluacion_items).length}`, responseId });
  };

  const handleConfirmOverwrite = async () => {
    setOverwriteConfirmOpen(false);
    if (!overwritePayload) return;
    const toastId = showLoading(`Reemplazando respuestas de ${lockedStudentInfo?.studentName}...`);
    try {
      await processAndSubmit(replaceEvaluationResponse, overwritePayload.answers);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al reemplazar: ${error.message}`);
      setScanResult({ studentName: 'Error', message: error.message, isError: true });
    } finally {
      setOverwritePayload(null);
      resetScanner();
    }
  };

  const handleAligned = useCallback(async (imageData: ImageData, qrCode: any) => {
    if (isProcessing || !evaluation || qrCode.data !== scannedQrData) return;

    setIsProcessing(true);
    const toastId = showLoading(`Analizando respuestas de ${lockedStudentInfo?.studentName}...`);

    try {
      const [, , rowLabel] = scannedQrData!.split('|');
      const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = qrCode.location;
      const srcPoints = [topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner];
      const dstWidth = 827;
      const dstHeight = 1169;
      const dstPoints = [{x:0, y:0}, {x:dstWidth, y:0}, {x:dstWidth, y:dstHeight}, {x:0, y:dstHeight}];
      
      const transform = getPerspectiveTransform(srcPoints, dstPoints);
      const warpedImageData = warpPerspective(imageData, transform, dstWidth, dstHeight);

      const allQuestions = evaluation.evaluation_content_blocks.flatMap(b => b.evaluacion_items).sort((a, b) => a.orden - b.orden);
      const processedAnswers: any[] = [];
      
      const questionsPerColumn = Math.ceil(allQuestions.length / 3);
      const colWidth = 230;
      const rowHeight = 28;
      const startX = 60;
      const startY = 380;
      const bubbleRadius = 7;

      allQuestions.forEach(q => {
        const shuffledAlts = seededShuffle(q.item_alternativas, `${seed}-${rowLabel}-${q.id}`);
        let minBrightness = 255;
        let selectedIndex = -1;

        const colIndex = Math.floor((q.orden - 1) / questionsPerColumn);
        const rowIndex = (q.orden - 1) % questionsPerColumn;

        for (let i = 0; i < q.item_alternativas.length; i++) {
          const bubbleX = startX + colIndex * colWidth + i * 45;
          const bubbleY = startY + rowIndex * rowHeight;
          const brightness = getBubbleDarkness(warpedImageData, bubbleX, bubbleY, bubbleRadius);
          if (brightness < minBrightness) {
            minBrightness = brightness;
            selectedIndex = i;
          }
        }
        
        if (selectedIndex > -1 && minBrightness < 150) {
          const selectedAlternative = shuffledAlts[selectedIndex];
          processedAnswers.push({ 
            itemId: q.id, 
            selectedAlternativeId: selectedAlternative.id,
            isCorrect: selectedAlternative.es_correcta,
            questionOrder: q.orden,
            selectedIndex: selectedIndex,
            alternativesCount: q.item_alternativas.length,
            score: selectedAlternative.es_correcta ? q.puntaje : 0,
          });
        }
      });

      if (processedAnswers.length < allQuestions.length * 0.9) {
        throw new Error(`Solo se leyeron ${processedAnswers.length} de ${allQuestions.length} respuestas. Intenta de nuevo con mejor iluminación y alineación.`);
      }

      const score = processedAnswers.reduce((acc, ans) => acc + ans.score, 0);
      const total = allQuestions.reduce((acc, q) => acc + q.puntaje, 0);
      const grade = calculateGrade(score, total);

      setReviewData({ warpedImageData, processedAnswers, score, total, grade });
      setScannerOpen(false);
      dismissToast(toastId);

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
      setScanResult({ studentName: 'Error', message: error.message, isError: true });
      resetScanner();
    }
  }, [evaluation, seed, isProcessing, scannedQrData, lockedStudentInfo]);

  const handleConfirmReview = async () => {
    if (!reviewData) return;
    const toastId = showLoading(`Guardando respuestas de ${lockedStudentInfo?.studentName}...`);
    const answersToSubmit = reviewData.processedAnswers.map((a: any) => ({ itemId: a.itemId, selectedAlternativeId: a.selectedAlternativeId }));
    try {
      await processAndSubmit(submitEvaluationResponse, answersToSubmit);
      resetScanner();
    } catch (error: any) {
      dismissToast(toastId);
      if (error.message.includes('User has already submitted a response')) {
        setOverwritePayload({ answers: answersToSubmit });
        setOverwriteConfirmOpen(true);
      } else {
        showError(error.message);
        setScanResult({ studentName: 'Error', message: error.message, isError: true });
        resetScanner();
      }
    }
  };

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to={`/dashboard/evaluacion/${evaluationId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la Evaluación
        </Link>

        {reviewData ? (
          <ScanReview 
            imageData={reviewData.warpedImageData}
            evaluation={evaluation!}
            processedAnswers={reviewData.processedAnswers}
            score={reviewData.score}
            total={reviewData.total}
            grade={reviewData.grade}
            studentName={lockedStudentInfo!.studentName}
            onConfirm={handleConfirmReview}
            onCancel={resetScanner}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Corrección Rápida con Cámara</CardTitle>
              <CardDescription>Apunta la cámara a la hoja de respuestas para corregir automáticamente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
                <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} disabled={isScannerOpen || isProcessing} />
                <p className="text-xs text-muted-foreground">Debe ser la misma que usaste para generar las hojas.</p>
              </div>
              <Button onClick={() => setScannerOpen(true)} className="w-full" disabled={isScannerOpen || isProcessing}>
                <Camera className="mr-2 h-4 w-4" /> Iniciar Escáner
              </Button>
              {scanResult && (
                <div className={cn("p-4 rounded-md flex items-center justify-between", scanResult.isError ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700')}>
                  <div className="flex items-center">
                    {scanResult.isError ? <XCircle className="h-6 w-6 mr-3" /> : <CheckCircle className="h-6 w-6 mr-3" />}
                    <div>
                      <p className="font-bold">{scanResult.studentName} {scanResult.score && `(${scanResult.score})`}</p>
                      <p>{scanResult.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {scanResult.responseId && (
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/dashboard/evaluacion/${evaluationId}/resultados/${scanResult.responseId}`}>
                          Ver Respuestas
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setScanResult(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {isScannerOpen && (
          <ScannerOverlay 
            onClose={resetScanner} 
            onQrScanned={handleQrScanned}
            onAligned={handleAligned}
            isProcessing={isProcessing}
            scanMode={scanMode}
            scanFeedback={lockedStudentInfo}
          />
        )}
      </div>
      <AlertDialog open={isOverwriteConfirmOpen} onOpenChange={setOverwriteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Respuesta Existente</AlertDialogTitle>
            <AlertDialogDescription>
              El estudiante {lockedStudentInfo?.studentName} ya tiene una respuesta para esta evaluación. ¿Deseas reemplazarla con esta nueva corrección?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setOverwritePayload(null); resetScanner(); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmOverwrite}>Reemplazar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EvaluationScannerPage;
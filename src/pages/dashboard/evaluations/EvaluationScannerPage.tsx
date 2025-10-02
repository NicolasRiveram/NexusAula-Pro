import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import jsQR from 'jsqr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Camera, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, submitEvaluationResponse } from '@/api/evaluationsApi';
import { seededShuffle } from '@/utils/shuffleUtils';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

const EvaluationScannerPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [seed, setSeed] = useState('nexus-2024');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ studentName: string; score: string; message: string } | null>(null);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (evaluationId) {
      fetchEvaluationDetails(evaluationId)
        .then(setEvaluation)
        .catch(err => showError(`Error al cargar la evaluación: ${err.message}`));
    }
    return () => {
      stopScan();
    };
  }, [evaluationId]);

  const startScan = async () => {
    if (!evaluation) {
      showError("No se ha cargado la información de la evaluación.");
      return;
    }
    setIsScanning(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      showError("No se pudo acceder a la cámara. Revisa los permisos.");
      setIsScanning(false);
    }
  };

  const stopScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const tick = useCallback(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      if (isScanning) requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code) {
      processQrCode(code, imageData);
    } else {
      requestAnimationFrame(tick);
    }
  }, [isScanning, evaluation, seed]);

  const processQrCode = async (code: any, imageData: ImageData) => {
    const qrData = code.data;
    if (lastScannedId === qrData) {
      requestAnimationFrame(tick); // Avoid re-scanning the same sheet immediately
      return;
    }

    const [evalId, studentId, rowLabel] = qrData.split('|');
    if (evalId !== evaluationId) {
      setScanResult({ studentName: 'Error', score: '', message: 'Este QR no pertenece a la evaluación actual.' });
      setTimeout(() => setScanResult(null), 3000);
      requestAnimationFrame(tick);
      return;
    }

    setIsScanning(false); // Pause scanning while processing
    const toastId = showLoading(`QR de ${rowLabel} detectado. Analizando respuestas...`);
    setLastScannedId(qrData);

    try {
      const allQuestions = evaluation!.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
      const answers: { itemId: string; selectedAlternativeId: string }[] = [];

      // This is a simplified OMR logic assuming a fixed layout relative to the QR code.
      // A real-world app would need more robust image processing (perspective correction, etc.)
      const qrSize = Math.max(code.location.topRightCorner.x - code.location.topLeftCorner.x, code.location.bottomLeftCorner.y - code.location.topLeftCorner.y);
      const bubbleRadius = qrSize * 0.1;
      const rowHeight = qrSize * 0.35;
      const colWidth = qrSize * 0.35;
      const startX = code.location.topLeftCorner.x + qrSize * 1.5;
      const startY = code.location.topLeftCorner.y + qrSize * 0.5;

      allQuestions.forEach(q => {
        const shuffledAlts = seededShuffle(q.item_alternativas, `${seed}-${rowLabel}-${q.id}`);
        let maxDarkness = 0;
        let selectedIndex = -1;

        for (let i = 0; i < q.item_alternativas.length; i++) {
          const bubbleX = startX + i * colWidth;
          const bubbleY = startY + (q.orden - 1) * rowHeight;
          const darkness = getBubbleDarkness(imageData, bubbleX, bubbleY, bubbleRadius);
          if (darkness > maxDarkness) {
            maxDarkness = darkness;
            selectedIndex = i;
          }
        }
        
        if (selectedIndex > -1 && maxDarkness > 50) { // Threshold for considering a bubble "filled"
          answers.push({ itemId: q.id, selectedAlternativeId: shuffledAlts[selectedIndex].id });
        }
      });

      if (answers.length !== allQuestions.length) {
        throw new Error("No se pudieron leer todas las respuestas. Intenta de nuevo con mejor iluminación.");
      }

      await submitEvaluationResponse(evaluationId, answers);
      
      dismissToast(toastId);
      showSuccess(`Respuestas de la Fila ${rowLabel} enviadas.`);
      setScanResult({ studentName: `Fila ${rowLabel}`, score: '', message: 'Respuestas enviadas con éxito.' });

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
      setScanResult({ studentName: 'Error', score: '', message: error.message });
    } finally {
      setTimeout(() => {
        setScanResult(null);
        setLastScannedId(null);
        if (!isScanning) setIsScanning(true);
        requestAnimationFrame(tick);
      }, 3000); // Cooldown before next scan
    }
  };

  const getBubbleDarkness = (imageData: ImageData, cx: number, cy: number, radius: number) => {
    let darkPixels = 0;
    const ctx = canvasRef.current!.getContext('2d')!;
    const data = ctx.getImageData(cx - radius, cy - radius, radius * 2, radius * 2).data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 128) { // Simple threshold for darkness
        darkPixels++;
      }
    }
    return darkPixels;
  };

  return (
    <div className="container mx-auto space-y-6">
      <Link to={`/dashboard/evaluacion/${evaluationId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la Evaluación
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Corrección Rápida con Cámara</CardTitle>
          <CardDescription>Apunta la cámara a la hoja de respuestas para corregir automáticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
              <Input id="seed" value={seed} onChange={(e) => setSeed(e.target.value)} disabled={isScanning} />
              <p className="text-xs text-muted-foreground">Debe ser la misma que usaste para generar las hojas.</p>
            </div>
            <div className="md:col-span-2 flex items-end">
              {!isScanning ? (
                <Button onClick={startScan} className="w-full"><Camera className="mr-2 h-4 w-4" /> Iniciar Escáner</Button>
              ) : (
                <Button onClick={stopScan} variant="destructive" className="w-full">Detener Escáner</Button>
              )}
            </div>
          </div>
          <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className={cn("w-full h-full object-cover", !isScanning && "hidden")} />
            <canvas ref={canvasRef} className="hidden" />
            {!isScanning && <p className="text-muted-foreground">La cámara está desactivada.</p>}
            {isScanning && (
              <div className="absolute inset-0 border-8 border-dashed border-white/50 rounded-md flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 text-white p-2 rounded-md">
                  Alinea el código QR con el recuadro
                </div>
              </div>
            )}
            {scanResult && (
              <div className={cn("absolute inset-0 flex flex-col items-center justify-center p-4 text-center", scanResult.message.includes('Error') ? 'bg-red-500/90' : 'bg-green-500/90')}>
                {scanResult.message.includes('Error') ? <XCircle className="h-16 w-16 text-white mb-4" /> : <CheckCircle className="h-16 w-16 text-white mb-4" />}
                <p className="text-2xl font-bold text-white">{scanResult.studentName}</p>
                <p className="text-lg text-white">{scanResult.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationScannerPage;
import React, { useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerOverlayProps {
  onClose: () => void;
  onQrScanned: (qrData: string) => void;
  onAligned: (imageData: ImageData, qrCode: any, corners: {x: number, y: number}[]) => void;
  isProcessing: boolean;
  scanMode: 'qr' | 'align';
  scanFeedback: { studentName: string; evalTitle: string } | null;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onClose, onQrScanned, onAligned, isProcessing, scanMode, scanFeedback }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();

  const drawGuides = (ctx: CanvasRenderingContext2D) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = 'white';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (scanMode === 'qr') {
      const boxSize = Math.min(w, h) * 0.6;
      const x = (w - boxSize) / 2;
      const y = (h - boxSize) / 2;
      ctx.strokeRect(x, y, boxSize, boxSize);
      ctx.fillText("Enfoca el código QR dentro del recuadro", w / 2, y / 2);
    } else {
      ctx.fillText("Alinea las 4 marcas negras de la hoja con las guías", w / 2, h * 0.1);
      
      const margin = 0.05; // 5% margin
      const cornerSize = 0.05; // 5% of width/height
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(w * margin, h * (margin + cornerSize));
      ctx.lineTo(w * margin, h * margin);
      ctx.lineTo(w * (margin + cornerSize), h * margin);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(w * (1 - margin), h * (margin + cornerSize));
      ctx.lineTo(w * (1 - margin), h * margin);
      ctx.lineTo(w * (1 - (margin + cornerSize)), h * margin);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(w * margin, h * (1 - (margin + cornerSize)));
      ctx.lineTo(w * margin, h * (1 - margin));
      ctx.lineTo(w * (margin + cornerSize), h * (1 - margin));
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(w * (1 - margin), h * (1 - (margin + cornerSize)));
      ctx.lineTo(w * (1 - margin), h * (1 - margin));
      ctx.lineTo(w * (1 - (margin + cornerSize)), h * (1 - margin));
      ctx.stroke();
    }
  };

  const tick = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA || isProcessing) {
      animationFrameId.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const overlayCanvas = overlayCanvasRef.current!;
    const overlayCtx = overlayCanvas.getContext('2d')!;
    
    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    drawGuides(overlayCtx);

    if (scanMode === 'qr') {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

      if (code) {
        onQrScanned(code.data);
        return;
      }
    }
    
    animationFrameId.current = requestAnimationFrame(tick);
  }, [isProcessing, onQrScanned, scanMode]);

  const handleCapture = () => {
    if (!videoRef.current || isProcessing) return;

    const video = videoRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    
    const w = video.videoWidth;
    const h = video.videoHeight;
    const margin = 0.05;
    const corners = [
      { x: w * margin, y: h * margin },
      { x: w * (1 - margin), y: h * margin },
      { x: w * (1 - margin), y: h * (1 - margin) },
      { x: w * margin, y: h * (1 - margin) },
    ];

    onAligned(imageData, null, corners);
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        console.error("Camera error:", err);
        onClose();
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [tick, onClose]);

  return (
    <div className="scanner-overlay">
      <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-20 text-white bg-black/50 hover:bg-black/70">
        <X className="h-6 w-6" />
      </Button>
      <div className="scanner-viewport">
        <video ref={videoRef} className="scanner-video" />
        <canvas ref={overlayCanvasRef} className="scanner-overlay-canvas" />
      </div>
      {scanFeedback && (
        <div className="scanner-feedback">
          <p className="font-bold">{scanFeedback.studentName}</p>
          <p className="text-sm">{scanFeedback.evalTitle}</p>
        </div>
      )}
      {scanMode === 'align' && (
        <Button onClick={handleCapture} disabled={isProcessing} size="lg" className="scanner-capture-button">
          <Camera className="mr-2 h-5 w-5" />
          Capturar Hoja
        </Button>
      )}
    </div>
  );
};

export default ScannerOverlay;
import React, { useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerOverlayProps {
  onClose: () => void;
  onQrScanned: (qrData: string) => void;
  onAligned: (imageData: ImageData, qrCode: any) => void;
  isProcessing: boolean;
  scanMode: 'qr' | 'align';
  scanFeedback: { studentName: string; evalTitle: string } | null;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onClose, onQrScanned, onAligned, isProcessing, scanMode, scanFeedback }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();

  const drawGuides = (ctx: CanvasRenderingContext2D, color: string, qrLocation?: any) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (scanMode === 'qr') {
      const boxSize = Math.min(w, h) * 0.6;
      const x = (w - boxSize) / 2;
      const y = (h - boxSize) / 2;
      ctx.strokeRect(x, y, boxSize, boxSize);
      ctx.fillText("Enfoca el código QR dentro del recuadro", w / 2, y / 2);
    } else {
      ctx.fillText("Alinea la hoja para que el recuadro se vea lo más rectangular posible", w / 2, h * 0.1);
      if (qrLocation) {
        ctx.beginPath();
        ctx.moveTo(qrLocation.topLeftCorner.x, qrLocation.topLeftCorner.y);
        ctx.lineTo(qrLocation.topRightCorner.x, qrLocation.topRightCorner.y);
        ctx.lineTo(qrLocation.bottomRightCorner.x, qrLocation.bottomRightCorner.y);
        ctx.lineTo(qrLocation.bottomLeftCorner.x, qrLocation.bottomLeftCorner.y);
        ctx.closePath();
        ctx.stroke();
      }
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
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;

    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    overlayCanvas.width = video.videoWidth;
    overlayCanvas.height = video.videoHeight;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    let guideColor = 'rgba(255, 255, 255, 0.5)';
    
    if (scanMode === 'qr') {
      if (code) {
        onQrScanned(code.data);
        return; // Stop loop, parent will change mode
      }
    } else if (scanMode === 'align') {
      if (code) {
        const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = code.location;
        const widthTop = Math.hypot(topRightCorner.x - topLeftCorner.x, topRightCorner.y - topLeftCorner.y);
        const widthBottom = Math.hypot(bottomRightCorner.x - bottomLeftCorner.x, bottomRightCorner.y - bottomLeftCorner.y);
        const heightLeft = Math.hypot(bottomLeftCorner.x - topLeftCorner.x, bottomLeftCorner.y - topLeftCorner.y);
        const heightRight = Math.hypot(bottomRightCorner.x - topRightCorner.x, bottomRightCorner.y - topRightCorner.y);
        const distortion = Math.abs(1 - widthTop / widthBottom) + Math.abs(1 - heightLeft / heightRight);
        
        if (distortion < 0.15) { // Stricter threshold for better alignment
          guideColor = 'rgba(74, 222, 128, 0.9)';
          onAligned(imageData, code);
          return; // Stop loop
        } else {
          guideColor = 'rgba(239, 68, 68, 0.9)';
        }
        drawGuides(overlayCtx, guideColor, code.location);
      } else {
        drawGuides(overlayCtx, guideColor);
      }
    } else {
      drawGuides(overlayCtx, guideColor);
    }
    
    animationFrameId.current = requestAnimationFrame(tick);
  }, [isProcessing, onAligned, onQrScanned, scanMode]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
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
    </div>
  );
};

export default ScannerOverlay;
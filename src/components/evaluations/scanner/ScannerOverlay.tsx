import React, { useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';
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

  const drawGuides = (ctx: CanvasRenderingContext2D, color: string) => {
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
      ctx.fillText("Alinea la hoja de respuestas con el recuadro", w / 2, h * 0.1);
      
      const a4AspectRatio = 1 / Math.sqrt(2);
      const padding = 0.1; // 10% padding

      let rectW, rectH;
      if ((h * (1 - padding * 2)) * a4AspectRatio < w * (1 - padding * 2)) {
        rectH = h * (1 - padding * 2);
        rectW = rectH * a4AspectRatio;
      } else {
        rectW = w * (1 - padding * 2);
        rectH = rectW / a4AspectRatio;
      }

      const rectX = (w - rectW) / 2;
      const rectY = (h - rectH) / 2;
      
      ctx.strokeRect(rectX, rectY, rectW, rectH);
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
    
    if (code) {
      const { topLeftCorner, topRightCorner, bottomRightCorner, bottomLeftCorner } = code.location;
      overlayCtx.beginPath();
      overlayCtx.moveTo(topLeftCorner.x, topLeftCorner.y);
      overlayCtx.lineTo(topRightCorner.x, topRightCorner.y);
      overlayCtx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
      overlayCtx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
      overlayCtx.closePath();
      overlayCtx.lineWidth = 4;
      overlayCtx.strokeStyle = 'yellow';
      overlayCtx.stroke();
    }

    if (scanMode === 'qr') {
      if (code) {
        onQrScanned(code.data);
        return;
      }
    } else if (scanMode === 'align') {
      if (code) {
        const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = code.location;
        const widthTop = Math.hypot(topRightCorner.x - topLeftCorner.x, topRightCorner.y - topLeftCorner.y);
        const widthBottom = Math.hypot(bottomRightCorner.x - bottomLeftCorner.x, bottomRightCorner.y - bottomLeftCorner.y);
        const heightLeft = Math.hypot(bottomLeftCorner.x - topLeftCorner.x, bottomLeftCorner.y - topLeftCorner.y);
        const heightRight = Math.hypot(bottomRightCorner.x - topRightCorner.x, bottomRightCorner.y - topRightCorner.y);
        const distortion = Math.abs(1 - widthTop / widthBottom) + Math.abs(1 - heightLeft / heightRight);
        
        if (distortion < 0.15) {
          guideColor = 'rgba(74, 222, 128, 0.9)';
          
          const a4AspectRatio = 1 / Math.sqrt(2);
          const padding = 0.1;
          let rectW, rectH;
          if ((video.videoHeight * (1 - padding * 2)) * a4AspectRatio < video.videoWidth * (1 - padding * 2)) {
            rectH = video.videoHeight * (1 - padding * 2);
            rectW = rectH * a4AspectRatio;
          } else {
            rectW = video.videoWidth * (1 - padding * 2);
            rectH = rectW / a4AspectRatio;
          }
          const rectX = (video.videoWidth - rectW) / 2;
          const rectY = (video.videoHeight - rectH) / 2;

          const corners = [
            { x: rectX, y: rectY },
            { x: rectX + rectW, y: rectY },
            { x: rectX + rectW, y: rectY + rectH },
            { x: rectX, y: rectY + rectH },
          ];
          onAligned(imageData, code, corners);
          return;
        } else {
          guideColor = 'rgba(239, 68, 68, 0.9)';
        }
      }
    }
    
    drawGuides(overlayCtx, guideColor);
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
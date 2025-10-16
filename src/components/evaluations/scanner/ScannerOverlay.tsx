import React, { useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScannerOverlayProps {
  onClose: () => void;
  onAligned: (imageData: ImageData, qrCode: any) => void;
  isProcessing: boolean;
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onClose, onAligned, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number>();

  const drawFiducialGuides = (ctx: CanvasRenderingContext2D, color: string) => {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const A4_ASPECT_RATIO = 210 / 297; // Ancho / Alto

    let guideBoxWidth, guideBoxHeight;

    // Calculate guide box dimensions to match A4 aspect ratio
    if (w / h > A4_ASPECT_RATIO) {
      // Canvas is wider than A4 paper, so height is the limiting factor
      guideBoxHeight = h * 0.9;
      guideBoxWidth = guideBoxHeight * A4_ASPECT_RATIO;
    } else {
      // Canvas is taller than A4 paper, so width is the limiting factor
      guideBoxWidth = w * 0.9;
      guideBoxHeight = guideBoxWidth / A4_ASPECT_RATIO;
    }

    const offsetX = (w - guideBoxWidth) / 2;
    const offsetY = (h - guideBoxHeight) / 2;
    const size = Math.min(guideBoxWidth, guideBoxHeight) * 0.04;

    const positions = [
      { x: offsetX, y: offsetY }, { x: offsetX + guideBoxWidth / 2, y: offsetY }, { x: offsetX + guideBoxWidth, y: offsetY },
      { x: offsetX, y: offsetY + guideBoxHeight / 2 }, { x: offsetX + guideBoxWidth, y: offsetY + guideBoxHeight / 2 },
      { x: offsetX, y: offsetY + guideBoxHeight }, { x: offsetX + guideBoxWidth / 2, y: offsetY + guideBoxHeight }, { x: offsetX + guideBoxWidth, y: offsetY + guideBoxHeight },
    ];

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.font = "16px sans-serif";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ALINEA LAS 8 MARCAS NEGRAS CON LAS GUÍAS", w / 2, offsetY / 2);

    positions.forEach(pos => {
      ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);
    });
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
    let isAligned = false;

    if (code) {
      const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = code.location;
      const widthTop = Math.hypot(topRightCorner.x - topLeftCorner.x, topRightCorner.y - topLeftCorner.y);
      const widthBottom = Math.hypot(bottomRightCorner.x - bottomLeftCorner.x, bottomRightCorner.y - bottomLeftCorner.y);
      const heightLeft = Math.hypot(bottomLeftCorner.x - topLeftCorner.x, bottomLeftCorner.y - topLeftCorner.y);
      const heightRight = Math.hypot(bottomRightCorner.x - topRightCorner.x, bottomRightCorner.y - topRightCorner.y);
      
      const distortion = Math.abs(1 - widthTop / widthBottom) + Math.abs(1 - heightLeft / heightRight);
      
      if (distortion < 0.2) { // Low distortion means it's relatively flat
        isAligned = true;
        guideColor = 'rgba(74, 222, 128, 0.9)';
      } else {
        guideColor = 'rgba(239, 68, 68, 0.9)';
      }
    }
    
    drawFiducialGuides(overlayCtx, guideColor);

    if (code && isAligned) {
      onAligned(imageData, code);
      return; // Stop the loop
    }
    
    animationFrameId.current = requestAnimationFrame(tick);
  }, [isProcessing, onAligned]);

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
    </div>
  );
};

export default ScannerOverlay;
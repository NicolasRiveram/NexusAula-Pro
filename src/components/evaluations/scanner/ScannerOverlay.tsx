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
  const overlayCanvasRef = useRef<HTMLCanvasElement>(<think>Initial files ranking:

src/pages/dashboard/evaluations/EvaluationScannerPage.tsx: 0.98

src/utils/perspective.ts: 0.98

src/components/evaluations/scanner/ScannerOverlay.tsx: 0.95

src/pages/dashboard/StudentDetailPage.tsx: 0.87

src/api/coursesApi.ts: 0.75

src/api/rubricsApi.ts: 0.70

src/utils/evaluationUtils.ts: 0.67

src/api/evaluationsApi.ts: 0.67

src/pages/dashboard/evaluations/EvaluationResultsPage.tsx: 0.59

src/pages/dashboard/evaluations/EvaluationDetailPage.tsx: 0.58

src/globals.css: 0.55

src/pages/dashboard/evaluations/StudentResponseDetailPage.tsx: 0.53

src/integrations/supabase/client.ts: 0.53

src/pages/dashboard/evaluations/EvaluationTakerPage.tsx: 0.48

src/pages/dashboard/EvaluationPage.tsx: 0.47

src/lib/utils.ts: 0.44

src/pages/dashboard/evaluations/EvaluationPage.tsx: 0.40

src/pages/dashboard/student/MyProgressPage.tsx: 0.39

src/components/ui/popover.tsx: 0.38

src/components/evaluations/results/ItemAnalysis.tsx: 0.38

supabase/functions/increase-question-difficulty/index.ts: 0.35

src/components/ui/sheet.tsx: 0.35

src/pages/dashboard/StudentDashboard.tsx: 0.35

supabase/functions/generate-questions/index.ts: 0.34

src/components/ui/card.tsx: 0.33

supabase/functions/decrease-question-difficulty/index.ts: 0.33

supabase/functions/generate-student-report/index.ts: 0.33

supabase/functions/generate-rubric/index.ts: 0.32

supabase/functions/generate-evaluation-aspects/index.ts: 0.28

src/pages/dashboard/evaluations/EvaluationBuilderPage.tsx: 0.28

supabase/functions/adapt-question-pie/index.ts: 0.28

src/components/dashboard/student/RecentPerformance.tsx: 0.28

src/components/ui/tooltip.tsx: 0.26

src/api/studentApi.ts: 0.26

src/components/ui/use-toast.ts: 0.25

src/pages/dashboard/rubrics/EvaluateRubricPage.tsx: 0.25

src/components/ui/accordion.tsx: 0.25

src/components/evaluations/printable/PrintableAnswerSheet.tsx: 0.23

src/pages/dashboard/CourseDetailPage.tsx: 0.23

src/components/ui/input.tsx: 0.23

src/components/ui/badge.tsx: 0.23

src/contexts/AuthContext.tsx: 0.22

src/components/evaluations/printable/PrintableEvaluation.tsx: 0.22

src/components/ui/collapsible.tsx: 0.22

src/components/ui/aspect-ratio.tsx: 0.22

src/components/rubrics/ReadingEvaluationModule.tsx: 0.22

src/components/ui/drawer.tsx: 0.21

src/components/ui/avatar.tsx: 0.21

src/components/ui/sonner.tsx: 0.21

supabase/functions/generate-class-sequence/index.ts: 0.20

src/pages/dashboard/courses/StudentCourseDetailPage.tsx: 0.20

src/pages/profile-setup/use-profile-data.ts: 0.20

src/components/evaluations/printable/PrintAnswerSheetDialog.tsx: 0.20

src/components/ui/scroll-area.tsx: 0.20

src/components/evaluations/AnswerKeyDialog.tsx: 0.19

src/pages/dashboard/evaluations/AdaptPIEPage.tsx: 0.19

src/components/evaluations/printable/PrintEvaluationDialog.tsx: 0.18

supabase/functions/generate-expected-standard/index.ts: 0.18

src/components/evaluations/printable/PrintableAnswerKey.tsx: 0.18

src/App.tsx: 0.18

supabase/functions/process-curriculum-url/index.ts: 0.16

src/components/rubrics/PrintableRubricForEvaluation.tsx: 0.16

src/components/ui/toaster.tsx: 0.15

src/components/ui/skeleton.tsx: 0.15

src/components/evaluations/results/SkillPerformanceChart.tsx: 0.15

src/pages/dashboard/DashboardIndex.tsx: 0.15

src/components/evaluations/builder/EditQuestionDialog.tsx: 0.15

src/components/ui/table.tsx: 0.15

src/components/ui/button.tsx: 0.15

tailwind.config.ts: 0.15

src/components/dashboard/teacher/RecentEvaluationsWidget.tsx: 0.15

src/components/evaluations/results/ScoreDistributionChart.tsx: 0.15

src/components/evaluations/builder/Step3_FinalReview.tsx: 0.14

supabase/functions/expert-curriculum-simulator/index.ts: 0.14

src/components/evaluations/builder/AddImageBlockDialog.tsx: 0.14

src/api/analyticsApi.ts: 0.14

supabase/migrations/0001_create_nexus_aula_schema.sql: 0.14

public/Nexusaulabrillo.png: 0.14

src/components/evaluations/results/EvaluationStatsCard.tsx: 0.14

vercel.json: 0.13

package.json: 0.13

supabase/functions/generate-unit-suggestions/index.ts: 0.13

src/components/evaluations/CreateEvaluationDialog.tsx: 0.13

src/components/ui/hover-card.tsx: 0.12

src/components/super-admin/expert-generator/GeneratorResultsComponent.tsx: 0.12

src/pages/Dashboard.tsx: 0.12

src/components/evaluations/builder/Step2_ContentBlocks.tsx: 0.12

src/api/dashboardApi.ts: 0.12

src/contexts/DesignContext.tsx: 0.12</think><think>Re-ranking the files. Please wait a moment...

Complexity: high

Reasoning: undefined

</think><dyad-codebase-context files="src/components/evaluations/scanner/ScannerOverlay.tsx,src/pages/dashboard/evaluations/EvaluationScannerPage.tsx,src/globals.css,src/utils/perspective.ts,src/api/evaluationsApi.ts"></dyad-codebase-context><think>dyad-token-savings?original-tokens=346508.75&smart-context-tokens=15552</think>null);
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
      const margin = 0.05; // 5% margin
      const cornerSize = 0.05; // 5% of width/height
      
      ctx.fillText("Alinea las 4 marcas de las esquinas con las guías", w / 2, h * 0.1);

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
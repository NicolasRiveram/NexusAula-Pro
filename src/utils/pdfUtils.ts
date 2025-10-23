import jsPDF from 'jspdf';
import { getLogoPublicUrl } from '@/api/settingsApi';

interface GuideContent {
  explicacion_detallada: string;
  ejemplos_practicos: { ejemplo: string; explicacion: string }[];
  actividades_repaso: { pregunta: string; tipo: string }[];
  conceptos_clave: { termino: string; definicion: string }[];
}

interface ClassInfo {
  title: string;
  courseName: string;
  subjectName: string;
}

interface EstablishmentInfo {
  name: string;
  logoUrl: string | null;
}

const addWrappedText = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number, options: any = {}) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y, options);
  const dimensions = doc.getTextDimensions(lines);
  return y + dimensions.h;
};

const checkPageBreak = (doc: jsPDF, currentY: number, neededHeight: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - 20) { // 20mm margin at bottom
    doc.addPage();
    return 20; // New starting Y
  }
  return currentY;
};

export const generateStudentGuidePdf = async (
  guideContent: GuideContent,
  classInfo: ClassInfo,
  establishmentInfo: EstablishmentInfo,
  teacherName: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  let currentY = 20;
  const margin = 15;
  const maxWidth = doc.internal.pageSize.getWidth() - (margin * 2);

  // Header
  if (establishmentInfo.logoUrl) {
    try {
      const logoFullUrl = getLogoPublicUrl(establishmentInfo.logoUrl);
      const response = await fetch(logoFullUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => {
          doc.addImage(reader.result as string, 'PNG', margin, 15, 30, 0, undefined, 'FAST');
          resolve();
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Could not load establishment logo for PDF:", error);
    }
  }

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(classInfo.title, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${classInfo.subjectName} - ${classInfo.courseName}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 6;
  doc.text(`Docente: ${teacherName}`, doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  currentY += 15;

  // Body
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Explicación Detallada', margin, currentY);
  currentY += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  currentY = addWrappedText(doc, guideContent.explicacion_detallada, margin, currentY, maxWidth);
  currentY += 10;

  currentY = checkPageBreak(doc, currentY, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ejemplos Prácticos', margin, currentY);
  currentY += 8;
  (guideContent.ejemplos_practicos || []).forEach((item, index) => {
    currentY = checkPageBreak(doc, currentY, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, `Ejemplo ${index + 1}: ${item.ejemplo}`, margin, currentY, maxWidth);
    currentY += 2;
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(doc, item.explicacion, margin + 5, currentY, maxWidth - 5);
    currentY += 6;
  });

  currentY = checkPageBreak(doc, currentY, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Actividades de Repaso', margin, currentY);
  currentY += 8;
  (guideContent.actividades_repaso || []).forEach((item, index) => {
    currentY = checkPageBreak(doc, currentY, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    currentY = addWrappedText(doc, `${index + 1}. ${item.pregunta}`, margin, currentY, maxWidth);
    currentY += 25; // Space for student to write
  });

  currentY = checkPageBreak(doc, currentY, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Conceptos Clave', margin, currentY);
  currentY += 8;
  (guideContent.conceptos_clave || []).forEach(item => {
    currentY = checkPageBreak(doc, currentY, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const termText = `${item.termino}: `;
    const termWidth = doc.getTextWidth(termText);
    doc.text(termText, margin, currentY);
    doc.setFont('helvetica', 'normal');
    currentY = addWrappedText(doc, item.definicion, margin + termWidth, currentY, maxWidth - termWidth);
    currentY += 4;
  });

  // Footer with page numbers
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
  }

  doc.save(`Guia_Estudio_${classInfo.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
};
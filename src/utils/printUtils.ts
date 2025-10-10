import ReactDOMServer from 'react-dom/server';
import React from 'react';

export const printComponent = (component: React.ReactElement, documentTitle: string, orientation: 'portrait' | 'landscape' = 'portrait') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, permite las ventanas emergentes para poder imprimir.');
    return;
  }

  const html = ReactDOMServer.renderToStaticMarkup(component);

  printWindow.document.write(`
    <html>
      <head>
        <title>${documentTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 ${orientation};
            margin: 10mm;
          }
          .printable-container {
            page-break-after: always;
            width: 190mm;
            min-height: 277mm;
            margin: 0 auto;
            position: relative;
          }
          .printable-container:last-child {
            page-break-after: auto;
          }

          /* Typography */
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-base { font-size: 1rem; line-height: 1.5rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .pl-5 { padding-left: 1.25rem; }

          /* General Header */
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header-left { width: 150px; }
          .print-header img {
            max-height: 50px;
            max-width: 150px;
            object-fit: contain;
          }
          .header-center { text-align: center; flex-grow: 1; }
          .evaluation-title { font-size: 1.8rem; font-weight: 700; margin: 0; }
          .teacher-name { font-size: 1rem; margin-top: 4px; color: #333; }
          .header-right { width: 150px; display: flex; justify-content: flex-end; }
          .header-divider { border: none; border-top: 1px solid #000; margin-bottom: 20px; }
          .fila-indicator { border: 3px solid #000; padding: 5px 10px; text-align: center; }
          .fila-indicator span { display: block; }
          .fila-indicator .fila-letter { font-size: 32px; font-weight: bold; line-height: 1; }

          /* Student Info Section */
          .student-info { display: flex; flex-direction: column; gap: 10px; border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
          .info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .info-item { display: flex; align-items: baseline; gap: 5px; font-size: 0.9rem; }
          .info-item label { font-weight: 600; white-space: nowrap; }
          .info-item span { font-weight: normal; }
          .info-item .line { flex-grow: 1; border-bottom: 1px solid #000; min-height: 20px; }

          /* Evaluation Content */
          .question-item { margin-top: 1.5rem; page-break-inside: avoid; }
          .question-enunciado { font-weight: 600; margin-bottom: 0.5rem; }
          .alternatives-list { list-style-type: none; padding-left: 1.25rem; margin: 0; }
          .alternatives-list li { margin-bottom: 0.25rem; }

          /* NEW STYLES FOR EVALUATION CONTAINERS */
          .info-block {
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .info-block h2 {
            font-size: 1rem;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 8px;
          }
          .info-block p {
            font-size: 0.9rem;
            margin: 0;
            color: #333;
          }
          .content-block-container {
            border: 1px solid #e0e0e0;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .content-block-container .content-block-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-top: 0;
            margin-bottom: 10px;
          }
          .content-block-container .content-block {
            font-size: 0.9rem;
            color: #333;
          }
          .content-block-container .content-block p {
            white-space: pre-wrap;
            margin: 0;
          }
          .content-block-container .content-block img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
          }

          /* OMR Answer Sheet Styles */
          .answer-sheet-container {
            border: 1px solid #333;
            padding: 10mm;
            position: relative;
            height: 100%;
            box-sizing: border-box;
          }
          .omr-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            border-bottom: 2px solid #000;
          }
          .omr-header .logo { max-height: 40px; max-width: 120px; object-fit: contain; }
          .omr-header .titles { text-align: center; }
          .omr-header .titles h1 { font-size: 14pt; font-weight: bold; margin: 0; }
          .omr-header .titles h2 { font-size: 11pt; font-weight: normal; margin: 2px 0 0 0; color: #444; }
          .omr-student-info {
            display: grid;
            grid-template-columns: 1fr 100px;
            gap: 10px;
            border: 1px solid #999;
            padding: 10px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .omr-student-info .data-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .omr-student-info .field { display: flex; align-items: baseline; font-size: 9pt; }
          .omr-student-info .field label { font-weight: bold; margin-right: 5px; white-space: nowrap; }
          .omr-student-info .field span { border-bottom: 1px solid #999; width: 100%; }
          .omr-qr-container { text-align: right; }
          .omr-qr-container p { font-size: 6pt; margin: 2px 0 0 0; letter-spacing: -0.5px; }
          .omr-instructions { text-align: center; font-size: 8pt; color: #555; margin-bottom: 15px; }
          .omr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .omr-column h3 { font-size: 9pt; font-weight: bold; text-align: center; margin: 0 0 5px 0; padding-bottom: 3px; border-bottom: 1px solid #ccc; }
          .omr-question-row { display: flex; align-items: center; margin-bottom: 4px; }
          .omr-question-row .q-number { font-size: 9pt; font-weight: bold; width: 25px; text-align: right; margin-right: 5px; }
          .omr-question-row .bubbles { display: flex; }
          .omr-question-row .bubble-container { display: flex; flex-direction: column; align-items: center; margin: 0 3px; }
          .omr-question-row .alt-label { font-size: 7pt; font-weight: bold; }
          .omr-question-row .bubble { width: 16px; height: 16px; border: 1px solid #000; border-radius: 50%; }
          .solid-fiducial { position: absolute; width: 5mm; height: 5mm; background-color: black !important; }
          .fm-s-top-left { top: 5mm; left: 5mm; }
          .fm-s-top-center { top: 5mm; left: 50%; transform: translateX(-50%); }
          .fm-s-top-right { top: 5mm; right: 5mm; }
          .fm-s-middle-left { top: 50%; left: 5mm; transform: translateY(-50%); }
          .fm-s-middle-right { top: 50%; right: 5mm; transform: translateY(-50%); }
          .fm-s-bottom-left { bottom: 5mm; left: 5mm; }
          .fm-s-bottom-center { bottom: 5mm; left: 50%; transform: translateX(-50%); }
          .fm-s-bottom-right { bottom: 5mm; right: 5mm; }

          /* Answer Key */
          .answer-key-title { font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 10px; }
          .answer-key-subtitle { font-size: 1.1rem; text-align: center; margin-bottom: 20px; }
          .answer-key-table { width: 100%; border-collapse: collapse; text-align: center; }
          .answer-key-table th, .answer-key-table td { border: 1px solid #000; padding: 8px; }
          .answer-key-table th { background-color: #f3f4f6 !important; }

          /* Report */
          .report-print .report-header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .report-print .report-header h1 { font-size: 2rem; margin: 0; }
          .report-print .report-body h2 { font-size: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 2rem; }
          .report-print .report-body h3 { font-size: 1.2rem; }
          .report-print .report-body ul { list-style-position: inside; }
          .report-print .page-break { page-break-before: always; }

          /* Rubric */
          .rubric-print .report-header h2 { font-size: 1.2rem; color: #555; margin-top: 5px; }
          .rubric-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.75rem; }
          .rubric-table th, .rubric-table td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
          .rubric-table th { background-color: #f3f4f6 !important; }
          .rubric-table .criterion-header { width: 20%; }
          .rubric-table .level-header { text-align: center; }
          .rubric-table .level-name { font-weight: bold; }
          .rubric-table .level-score { font-size: 0.9em; }
          .rubric-table .criterion-cell .criterion-name { font-weight: bold; }
          .rubric-table .criterion-cell .criterion-skill { font-size: 0.9em; color: #555; font-style: italic; margin: 4px 0; }
          .rubric-table .criterion-cell .criterion-description { font-size: 0.9em; color: #555; }
          .rubric-table .level-cell .level-description { font-size: 0.9em; }
          .rubric-table .level-cell-eval { text-align: center; }
          .rubric-table .level-cell-eval .bubble { width: 18px; height: 18px; border: 1px solid #000; border-radius: 50%; margin: 0 auto 5px auto; }
          .comments-section { margin-top: 20px; page-break-inside: avoid; }
          .comments-section label { font-weight: bold; }
          .comments-box { border: 1px solid #ccc; height: 100px; margin-top: 5px; border-radius: 4px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};
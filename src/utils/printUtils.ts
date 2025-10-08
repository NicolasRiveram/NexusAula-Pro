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
            margin: 15mm;
          }
          .printable-container {
            page-break-after: always;
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
            border-bottom: 1px solid #ccc;
            margin-bottom: 20px;
          }
          .print-header img {
            max-height: 50px;
            max-width: 150px;
            object-fit: contain;
          }
          .print-header-info { text-align: center; }
          .print-header-info h1 { font-size: 1.5rem; font-weight: 700; margin: 0; }
          .print-header-info p { font-size: 1rem; margin: 4px 0 0 0; color: #333; }

          /* Evaluation Specific Header */
          .header-center { text-align: center; }
          .evaluation-title { font-size: 1.8rem; font-weight: 700; margin: 0; }
          .teacher-name { font-size: 1rem; margin-top: 4px; color: #333; }
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
          .content-block-title { font-weight: bold; margin-bottom: 10px; font-size: 1.1em; }
          .question-item { page-break-inside: avoid; margin-bottom: 20px; }
          .alternatives-list { list-style-type: none; padding-left: 0; }
          .alternatives-list li { margin-bottom: 5px; }
          .content-block { page-break-inside: avoid; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .content-block p { text-align: justify; white-space: pre-wrap; }
          .content-block img { max-width: 100%; height: auto; display: block; margin: 0 auto; }

          /* Answer Sheet */
          .answer-sheet-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
          .qr-code-container { text-align: center; }
          .qr-code-container p { font-size: 8px; margin-top: 4px; }
          .answer-sheet-title { text-align: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 5px; }
          .answer-sheet-instructions { text-align: center; font-size: 0.9rem; color: #555; margin-bottom: 20px; }
          .answer-grid { width: 100%; border-collapse: collapse; }
          .answer-grid .question-number { font-weight: bold; text-align: right; padding-right: 10px; width: 40px; }
          .answer-grid .alternative-cell { text-align: center; padding: 8px 0; }
          .answer-grid .bubble { width: 20px; height: 20px; border: 1px solid #000; border-radius: 50%; margin: 0 auto; }
          .answer-grid .alt-label { font-size: 10px; margin-top: 2px; }

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
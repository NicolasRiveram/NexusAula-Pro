import ReactDOMServer from 'react-dom/server';
import React from 'react';

export const printComponent = (component: React.ReactElement, documentTitle: string) => {
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
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          .printable-container {
            page-break-after: always;
          }
          .printable-container:last-child {
            page-break-after: auto;
          }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-base { font-size: 1rem; line-height: 1.5rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .pl-5 { padding-left: 1.25rem; }
          
          /* New Header Styles */
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 10px;
          }
          .header-left {
            width: 25%;
          }
          .header-left img {
            max-height: 50px;
            max-width: 100%;
          }
          .header-center {
            width: 50%;
            text-align: center;
          }
          .header-right {
            width: 25%;
          }
          .evaluation-title {
            font-size: 1.8rem;
            font-weight: 700;
            margin: 0;
          }
          .teacher-name {
            font-size: 1rem;
            margin-top: 4px;
            color: #333;
          }
          .header-divider {
            border: none;
            border-top: 1px solid #000;
            margin-bottom: 20px;
          }

          /* New Student Info Styles */
          .student-info {
            display: flex;
            flex-direction: column;
            gap: 10px;
            border: 1px solid #ccc;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .info-row {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .info-item {
            display: flex;
            align-items: baseline;
            gap: 5px;
            font-size: 0.9rem;
          }
          .info-item label {
            font-weight: 600;
            white-space: nowrap;
          }
          .info-item span {
            font-weight: normal;
          }
          .info-item .line {
            flex-grow: 1;
            border-bottom: 1px solid #000;
            min-height: 20px;
          }

          /* Question Formatting */
          .question-item {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          .content-block-wrapper {
            /* This class is now just a container */
          }
          .content-block {
            page-break-inside: avoid; /* This ensures the content block itself (text/image) isn't split */
            border: 1px solid #eee;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            background-color: transparent !important;
          }
          .content-block p {
            text-align: justify;
            white-space: pre-wrap;
          }
          .content-block img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
          }
          /* Answer Sheet Styles */
          .answer-sheet-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
          .qr-code-container { text-align: center; }
          .qr-code-container p { font-size: 8px; margin-top: 4px; }
          .fila-indicator { border: 3px solid #000; padding: 10px 20px; text-align: center; }
          .fila-indicator .fila-letter { font-size: 48px; font-weight: bold; line-height: 1; }
          .answer-sheet-title { text-align: center; font-size: 1.5rem; font-weight: bold; margin-bottom: 5px; }
          .answer-sheet-instructions { text-align: center; font-size: 0.9rem; color: #555; margin-bottom: 20px; }
          .answer-grid { width: 100%; border-collapse: collapse; }
          .answer-grid .question-number { font-weight: bold; text-align: right; padding-right: 10px; width: 40px; }
          .answer-grid .alternative-cell { text-align: center; padding: 8px 0; }
          .answer-grid .bubble { width: 20px; height: 20px; border: 1px solid #000; border-radius: 50%; margin: 0 auto; }
          .answer-grid .alt-label { font-size: 10px; margin-top: 2px; }
          /* Answer Key Styles */
          .answer-key-title { font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 10px; }
          .answer-key-subtitle { font-size: 1.1rem; text-align: center; margin-bottom: 20px; }
          .answer-key-table { width: 100%; border-collapse: collapse; text-align: center; }
          .answer-key-table th, .answer-key-table td { border: 1px solid #000; padding: 8px; }
          .answer-key-table th { background-color: #f3f4f6; }
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
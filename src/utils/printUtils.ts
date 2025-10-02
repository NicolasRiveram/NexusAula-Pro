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
            width: 100%;
            max-width: 210mm; /* A4 width */
            margin: 0 auto;
          }
          .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
          .text-base { font-size: 1rem; line-height: 1.5rem; }
          .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .pl-5 { padding-left: 1.25rem; }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .print-header img {
            max-height: 60px;
            max-width: 150px;
          }
          .print-header-info {
            text-align: right;
          }
          .student-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 20px;
            border: 1px solid #ccc;
            padding: 10px;
            margin-bottom: 20px;
            border-radius: 5px;
          }
          .student-info-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .student-info-item label {
            font-weight: 600;
          }
          .student-info-item .line {
            flex-grow: 1;
            border-bottom: 1px solid #000;
            min-height: 20px;
          }
          .question-block {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .question-enunciado {
            font-weight: 600;
            margin-bottom: 10px;
          }
          .alternatives-list {
            list-style-type: none;
            padding-left: 20px;
          }
          .alternatives-list li {
            margin-bottom: 8px;
          }
          .content-block {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .content-block p {
            white-space: pre-wrap;
          }
          .content-block img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
          }
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
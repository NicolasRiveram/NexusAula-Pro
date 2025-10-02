import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableAnswerSheetProps {
  evaluationTitle: string;
  establishmentName: string;
  logoUrl: string | null;
  studentName: string;
  courseName: string;
  rowLabel: string;
  qrCodeData: string;
  questions: {
    orden: number;
    alternativesCount: number;
  }[];
}

const PrintableAnswerSheet: React.FC<PrintableAnswerSheetProps> = ({
  evaluationTitle,
  establishmentName,
  logoUrl,
  studentName,
  courseName,
  rowLabel,
  qrCodeData,
  questions,
}) => {
  const alternatives = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div className="printable-container answer-sheet">
      <header className="print-header">
        {logoUrl && <img src={logoUrl} alt={establishmentName} />}
        <div className="print-header-info">
          <h1 className="text-lg font-bold">{establishmentName}</h1>
          <p className="text-sm">{evaluationTitle}</p>
        </div>
      </header>

      <section className="student-info">
        <div className="student-info-item"><label>Nombre:</label><span>{studentName}</span></div>
        <div className="student-info-item"><label>Curso:</label><span>{courseName}</span></div>
        <div className="student-info-item"><label>Fecha:</label><div className="line"></div></div>
        <div className="student-info-item"><label>Puntaje:</label><div className="line"></div></div>
      </section>

      <div className="answer-sheet-header">
        <div className="qr-code-container">
          <QRCodeSVG value={qrCodeData} size={80} />
          <p>ID: {qrCodeData}</p>
        </div>
        <div className="fila-indicator">
          <span>FILA</span>
          <span className="fila-letter">{rowLabel}</span>
        </div>
      </div>

      <h2 className="answer-sheet-title">Hoja de Respuestas</h2>
      <p className="answer-sheet-instructions">
        Rellena completamente el círculo de la alternativa que consideres correcta. No hagas otras marcas.
      </p>

      <table className="answer-grid">
        <tbody>
          {questions.map(q => (
            <tr key={q.orden}>
              <td className="question-number">{q.orden}</td>
              {alternatives.map((alt, index) => (
                <td key={alt} className="alternative-cell">
                  {index < q.alternativesCount && (
                    <>
                      <div className="bubble"></div>
                      <span className="alt-label">{alt}</span>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableAnswerSheet;
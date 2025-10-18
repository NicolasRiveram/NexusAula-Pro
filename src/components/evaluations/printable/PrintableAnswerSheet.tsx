import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getLogoPublicUrl } from '@/api/settingsApi';

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
  const alternatives = ['A', 'B', 'C', 'D'];
  const fullLogoUrl = logoUrl ? getLogoPublicUrl(logoUrl) : null;

  const sortedQuestions = [...questions].sort((a, b) => a.orden - b.orden);

  return (
    <div className="printable-container answer-sheet-container">
      <div className="fiducial-marker fm-top-left"></div>
      <div className="fiducial-marker fm-top-right"></div>
      <div className="fiducial-marker fm-bottom-left"></div>
      <div className="fiducial-marker fm-bottom-right"></div>

      <header className="omr-header">
        {fullLogoUrl && <img src={fullLogoUrl} alt={establishmentName} className="logo" />}
        <div className="titles">
          <h1>{establishmentName}</h1>
          <h2>{evaluationTitle}</h2>
        </div>
        <div className="omr-qr-container">
          <QRCodeSVG value={qrCodeData} size={60} />
          <p>Fila {rowLabel}</p>
        </div>
      </header>

      <section className="omr-student-info">
        <div className="data-fields">
          <div className="field"><label>Nombre:</label><span>{studentName}</span></div>
          <div className="field"><label>Curso:</label><span>{courseName}</span></div>
          <div className="field"><label>Fecha:</label><span /></div>
          <div className="field"><label>Puntaje:</label><span /></div>
        </div>
      </section>

      <p className="omr-instructions">
        Rellena completamente el círculo de la alternativa que consideres correcta. No hagas otras marcas.
      </p>

      <main className="omr-grid">
        {sortedQuestions.map(q => (
          <div key={q.orden} className="omr-question-row">
            <div className="q-number">{q.orden}</div>
            <div className="bubbles">
              {alternatives.map((alt, index) => (
                <div key={alt} className="bubble-container">
                  <span className="alt-label">{alt}</span>
                  {index < q.alternativesCount ? <div className="bubble"></div> : <div style={{width: '18px', height: '18px'}}></div>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default PrintableAnswerSheet;
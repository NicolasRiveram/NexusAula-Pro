import React from 'react';
import { Report } from '@/api/reportsApi';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintableReportProps {
  report: Report;
}

const PrintableReport: React.FC<PrintableReportProps> = ({ report }) => {
  return (
    <div className="printable-container report-print">
      <header className="report-header">
        <h1>Informe de Progreso Pedagógico</h1>
      </header>
      
      <section className="student-info">
        <div className="info-row">
          <div className="info-item"><label>Estudiante:</label><span>{report.perfiles.nombre_completo}</span></div>
          <div className="info-item"><label>Fecha de Emisión:</label><span>{format(parseISO(report.created_at), "d 'de' LLLL, yyyy", { locale: es })}</span></div>
        </div>
      </section>

      <main className="report-body">
        <div className="report-section" dangerouslySetInnerHTML={{ __html: report.informe_docente_html }} />
        <div className="page-break"></div>
        <div className="report-section" dangerouslySetInnerHTML={{ __html: report.comunicado_apoderado_html }} />
      </main>
    </div>
  );
};

export default PrintableReport;
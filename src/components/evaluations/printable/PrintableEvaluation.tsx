import React from 'react';
import { EvaluationDetail } from '@/api/evaluationsApi';
import { Establishment } from '@/contexts/EstablishmentContext';
import { getPublicImageUrl } from '@/api/evaluationsApi';
import { getLogoPublicUrl } from '@/api/settingsApi';

interface PrintableEvaluationProps {
  evaluation: EvaluationDetail;
  establishment: Establishment | null;
  fontSize: 'text-sm' | 'text-base' | 'text-lg';
  teacherName: string;
  totalScore: number;
  rowLabel?: string;
  usePieAdaptations?: boolean;
}

const PrintableEvaluation: React.FC<PrintableEvaluationProps> = ({ evaluation, establishment, fontSize, teacherName, totalScore, rowLabel, usePieAdaptations = false }) => {
  const logoUrl = establishment?.logo_url ? getLogoPublicUrl(establishment.logo_url) : null;
  const passingScore = totalScore * 0.6;
  const subjectNames = [...new Set(evaluation.curso_asignaturas.map(ca => ca.asignatura.nombre))].join(' / ');

  return (
    <div className={`printable-container ${fontSize}`}>
      <header className="print-header">
        <div className="header-left">
          {logoUrl && <img src={logoUrl} alt={establishment?.nombre || ''} />}
        </div>
        <div className="header-center">
          <h1 className="evaluation-title">{evaluation.titulo}</h1>
          <p className="teacher-name">{teacherName} - {subjectNames}</p>
        </div>
        <div className="header-right">
          {rowLabel && (
            <div className="fila-indicator">
              <span>FILA</span>
              <span className="fila-letter">{rowLabel}</span>
            </div>
          )}
        </div>
      </header>
      <hr className="header-divider" />

      <section className="student-info">
        <div className="info-row">
          <div className="info-item"><label>Nombre:</label><div className="line"></div></div>
          <div className="info-item"><label>Curso:</label><div className="line"></div></div>
          <div className="info-item"><label>Fecha:</label><div className="line"></div></div>
        </div>
        <div className="info-row">
          <div className="info-item"><label>Docente:</label><span>{teacherName}</span></div>
          <div className="info-item"><label>Puntaje Total:</label><span>{totalScore} pts.</span></div>
          <div className="info-item"><label>Puntaje Aprobación (4,0):</label><span>{Math.round(passingScore || 0)} pts.</span></div>
        </div>
      </section>

      {evaluation.aspectos_a_evaluar_ia && (
        <section className="info-block">
          <h2>Aspectos a Evaluar</h2>
          <p>{evaluation.aspectos_a_evaluar_ia}</p>
        </section>
      )}

      <main>
        {(evaluation.evaluation_content_blocks || []).map(block => {
          let contentElement = null;
          if (block.visible_en_evaluacion && block.content) {
            if ((block.block_type === 'text' || block.block_type === 'syllabus') && typeof block.content.text === 'string') {
              contentElement = <p>{block.content.text}</p>;
            } else if (block.block_type === 'image' && typeof block.content.imageUrl === 'string') {
              contentElement = <img src={getPublicImageUrl(block.content.imageUrl)} alt={`Contenido ${block.orden}`} />;
            }
          }

          return (
            <div key={block.id} className="content-block-wrapper">
              {contentElement && (
                <div className="content-block-container">
                  {block.title && <h2 className="content-block-title">{block.title}</h2>}
                  <div className="content-block">{contentElement}</div>
                </div>
              )}
              {(block.evaluacion_items || []).map(item => {
                const adaptation = usePieAdaptations && item.tiene_adaptacion_pie && item.adaptaciones_pie?.[0];
                const enunciado = adaptation ? adaptation.enunciado_adaptado : item.enunciado;
                const alternativas = adaptation 
                  ? adaptation.alternativas_adaptadas 
                  : item.item_alternativas;

                return (
                  <div key={item.id} className="question-item">
                    <p className="question-enunciado" dangerouslySetInnerHTML={{ __html: `${item.orden}. ${enunciado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')} (${item.puntaje || 0} pts.)` }} />
                    {item.tipo_item === 'seleccion_multiple' && (
                      <ul className="alternatives-list">
                        {(alternativas || []).map((alt, index) => (
                          <li key={index}>
                            {String.fromCharCode(97 + index)}) {alt.texto || ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default PrintableEvaluation;
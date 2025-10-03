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
}

const PrintableEvaluation: React.FC<PrintableEvaluationProps> = ({ evaluation, establishment, fontSize, teacherName, totalScore, rowLabel }) => {
  const logoUrl = establishment?.logo_url ? getLogoPublicUrl(establishment.logo_url) : null;
  const passingScore = totalScore * 0.6;

  return (
    <div className={`printable-container ${fontSize}`}>
      <header className="print-header">
        <div className="header-left">
          {logoUrl && <img src={logoUrl} alt={establishment?.nombre || ''} />}
        </div>
        <div className="header-center">
          <h1 className="evaluation-title">{evaluation.titulo}</h1>
          <p className="teacher-name">{teacherName}</p>
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
          <div className="info-item"><label>Puntaje Aprobación (4,0):</label><span>{(passingScore || 0).toFixed(1)} pts.</span></div>
        </div>
      </section>

      {evaluation.aspectos_a_evaluar_ia && (
        <section className="mb-4">
          <h2 className="font-bold mb-2">Aspectos a Evaluar</h2>
          <p className="text-sm">{evaluation.aspectos_a_evaluar_ia}</p>
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
              {contentElement && <div className="content-block">{contentElement}</div>}
              {(block.evaluacion_items || []).map(item => (
                <div key={item.id} className="question-item">
                  <p className="question-enunciado">{item.orden}. {item.enunciado || ''} ({item.puntaje || 0} pts.)</p>
                  {item.tipo_item === 'seleccion_multiple' && (
                    <ul className="alternatives-list">
                      {(item.item_alternativas || []).sort((a, b) => a.orden - b.orden).map((alt, index) => (
                        <li key={alt.id}>
                          {String.fromCharCode(97 + index)}) {alt.texto || ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default PrintableEvaluation;
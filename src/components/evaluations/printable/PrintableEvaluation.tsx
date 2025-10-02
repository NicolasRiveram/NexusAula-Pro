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
  passingScore: number;
}

const PrintableEvaluation: React.FC<PrintableEvaluationProps> = ({ evaluation, establishment, fontSize, teacherName, totalScore, passingScore }) => {
  const logoUrl = establishment?.logo_url ? getLogoPublicUrl(establishment.logo_url) : null;

  return (
    <div className={`printable-container ${fontSize}`}>
      <header className="print-header">
        {logoUrl && <img src={logoUrl} alt={establishment?.nombre || ''} />}
        <div className="print-header-info">
          <h1 className="evaluation-title">{evaluation.titulo}</h1>
          <p className="establishment-name">{establishment?.nombre}</p>
        </div>
      </header>

      <section className="student-info">
        <div className="student-info-item"><label>Nombre:</label><div className="line"></div></div>
        <div className="student-info-item"><label>Curso:</label><div className="line"></div></div>
        <div className="student-info-item"><label>Fecha:</label><div className="line"></div></div>
        <div className="student-info-item"><label>Docente:</label><span>{teacherName}</span></div>
        <div className="student-info-item"><label>Puntaje Total:</label><span>{totalScore} pts.</span></div>
        <div className="student-info-item"><label>Puntaje Aprobación (4,0):</label><span>{(passingScore || 0).toFixed(1)} pts.</span></div>
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
            <div key={block.id} className="question-block">
              {contentElement && <div className="content-block">{contentElement}</div>}
              {(block.evaluacion_items || []).map(item => (
                <div key={item.id} className="mb-4">
                  <p className="question-enunciado">{item.orden}. {item.enunciado || ''} ({item.puntaje} pts.)</p>
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
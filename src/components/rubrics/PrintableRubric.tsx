import React from 'react';
import { Rubric } from '@/api/rubricsApi';

interface PrintableRubricProps {
  rubric: Rubric;
}

const PrintableRubric: React.FC<PrintableRubricProps> = ({ rubric }) => {
  const criterios = rubric.contenido_json?.criterios;
  const hasCriterios = Array.isArray(criterios) && criterios.length > 0;

  return (
    <div id="printable-rubric" className="printable-container rubric-print">
      <header className="report-header">
        <h1>Rúbrica de Evaluación</h1>
        <h2>{rubric.nombre}</h2>
      </header>
      <section className="student-info">
        <div className="info-row">
          <div className="info-item" style={{ gridColumn: 'span 3' }}><label>Actividad a Evaluar:</label><span>{rubric.actividad_a_evaluar}</span></div>
        </div>
        <div className="info-row">
          <div className="info-item" style={{ gridColumn: 'span 3' }}><label>Descripción:</label><span>{rubric.descripcion}</span></div>
        </div>
      </section>
      
      {hasCriterios && (
        <table className="rubric-table">
          <thead>
            <tr>
              <th className="criterion-header">Criterio de Evaluación</th>
              {criterios[0]?.niveles?.map((level, levelIndex) => (
                <th key={levelIndex} className="level-header">
                  <p className="level-name">{level.nombre}</p>
                  <p className="level-score">({level.puntaje} pts)</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criterios.map((criterion, critIndex) => (
              <tr key={critIndex}>
                <td className="criterion-cell">
                  <p className="criterion-name">{criterion.nombre}</p>
                  <p className="criterion-skill">{criterion.habilidad}</p>
                  <p className="criterion-description">{criterion.descripcion}</p>
                </td>
                {criterion.niveles.map((level, levelIndex) => (
                  <td key={levelIndex} className="level-cell">
                    <p className="level-description">{level.descripcion}</p>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PrintableRubric;
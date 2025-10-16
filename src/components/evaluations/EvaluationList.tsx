import React from 'react';
import { Evaluation } from '@/api/evaluations';
import EvaluationCard from './EvaluationCard';

interface EvaluationListProps {
  evaluations: Evaluation[];
  selectedEvaluations: string[];
  onSelectionChange: (id: string, selected: boolean) => void;
  onViewDetails: (id: string) => void;
  onViewResults: (id: string) => void;
  onShowAnswerKey: (id: string) => void;
  onPrint: (id: string) => void;
  onPrintAnswerSheet: (id: string) => void;
  onDelete: (evaluation: Evaluation) => void;
  onCorrectWithCamera: (id: string) => void;
}

const EvaluationList: React.FC<EvaluationListProps> = (props) => {
  const groupEvaluationsByLevel = (evals: Evaluation[]): Record<string, Evaluation[]> => {
    const groups: Record<string, Evaluation[]> = {};
    evals.forEach(evaluation => {
      const levels = new Set<string>();
      if (evaluation.curso_asignaturas && evaluation.curso_asignaturas.length > 0) {
        evaluation.curso_asignaturas.forEach(ca => {
          if (ca.curso?.nivel?.nombre) {
            levels.add(ca.curso.nivel.nombre);
          }
        });
      }

      if (levels.size === 0) {
        const key = 'Sin Asignar';
        if (!groups[key]) groups[key] = [];
        if (!groups[key].some(e => e.id === evaluation.id)) {
          groups[key].push(evaluation);
        }
      } else {
        levels.forEach(levelName => {
          if (!groups[levelName]) groups[levelName] = [];
          if (!groups[levelName].some(e => e.id === evaluation.id)) {
            groups[levelName].push(evaluation);
          }
        });
      }
    });
    return groups;
  };

  if (props.evaluations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg mt-4">
        <h3 className="text-xl font-semibold">No hay evaluaciones de este tipo</h3>
        <p className="text-muted-foreground mt-2">Crea una nueva evaluación para empezar.</p>
      </div>
    );
  }

  const grouped = groupEvaluationsByLevel(props.evaluations);
  const sortedLevels = Object.keys(grouped).sort();

  return (
    <div className="space-y-8 mt-4">
      {sortedLevels.map(levelName => (
        <div key={levelName}>
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{levelName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grouped[levelName].map(evaluation => (
              <EvaluationCard
                key={evaluation.id}
                evaluation={evaluation}
                isSelected={props.selectedEvaluations.includes(evaluation.id)}
                onSelectionChange={props.onSelectionChange}
                onViewDetails={props.onViewDetails}
                onViewResults={props.onViewResults}
                onShowAnswerKey={props.onShowAnswerKey}
                onPrint={props.onPrint}
                onPrintAnswerSheet={props.onPrintAnswerSheet}
                onDelete={props.onDelete}
                onCorrectWithCamera={props.onCorrectWithCamera}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EvaluationList;
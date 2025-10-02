import React from 'react';

interface AnswerKey {
  [rowLabel: string]: {
    [questionNumber: number]: string;
  };
}

interface PrintableAnswerKeyProps {
  evaluationTitle: string;
  answerKey: AnswerKey;
}

const PrintableAnswerKey: React.FC<PrintableAnswerKeyProps> = ({ evaluationTitle, answerKey }) => {
  const rows = Object.keys(answerKey).sort();
  const questions = Array.from(new Set(Object.values(answerKey).flatMap(row => Object.keys(row).map(Number)))).sort((a, b) => a - b);

  return (
    <div className="printable-container answer-key">
      <h1 className="answer-key-title">Pauta de Corrección</h1>
      <h2 className="answer-key-subtitle">{evaluationTitle}</h2>

      <table className="answer-key-table">
        <thead>
          <tr>
            <th>Pregunta</th>
            {rows.map(row => <th key={row}>Fila {row}</th>)}
          </tr>
        </thead>
        <tbody>
          {questions.map(qNum => (
            <tr key={qNum}>
              <td>{qNum}</td>
              {rows.map(row => (
                <td key={row}>{answerKey[row][qNum] || '-'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PrintableAnswerKey;
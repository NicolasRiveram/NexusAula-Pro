import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvaluationDetail } from '@/api/evaluationsApi';
import StudentAnswerRow from './StudentAnswerRow';
import { generateBalancedShuffledAlternatives } from '@/utils/shuffleUtils';

interface ManualEntryTableProps {
  evaluation: EvaluationDetail;
  students: { id: string; nombre_completo: string }[];
  seed: string;
}

const ManualEntryTable: React.FC<ManualEntryTableProps> = ({ evaluation, students, seed }) => {
  const questions = evaluation.evaluation_content_blocks
    .flatMap(b => b.evaluacion_items)
    .sort((a, b) => a.orden - b.orden);

  const [studentRows, setStudentRows] = useState<Record<string, string>>({});

  const shuffledMaps = useMemo(() => {
    const mapA = generateBalancedShuffledAlternatives(questions, seed, 'A');
    const mapB = generateBalancedShuffledAlternatives(questions, seed, 'B');
    return { A: mapA, B: mapB };
  }, [questions, seed]);

  const handleRowChange = (studentId: string, row: string) => {
    setStudentRows(prev => ({ ...prev, [studentId]: row }));
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10 min-w-[250px] border-r">Estudiante</TableHead>
            <TableHead className="min-w-[120px]">Fila</TableHead>
            {questions.map(q => (
              <TableHead key={q.id} className="text-center min-w-[80px]">{q.orden}</TableHead>
            ))}
            <TableHead className="sticky right-0 bg-card z-10 min-w-[150px] border-l text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => (
            <StudentAnswerRow
              key={student.id}
              student={student}
              evaluation={evaluation}
              questions={questions}
              shuffledAlternativesMap={shuffledMaps[studentRows[student.id] || 'A'] || {}}
              selectedRow={studentRows[student.id] || 'A'}
              onRowChange={handleRowChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ManualEntryTable;
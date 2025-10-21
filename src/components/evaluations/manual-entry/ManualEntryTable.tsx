import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EvaluationDetail, StudentEvaluationAssignment } from '@/api/evaluationsApi';
import StudentAnswerRow from './StudentAnswerRow';
import { generateBalancedShuffledAlternatives } from '@/utils/shuffleUtils';

interface ManualEntryTableProps {
  evaluation: EvaluationDetail;
  students: { id: string; nombre_completo: string }[];
  seed: string;
  existingResponses: Map<string, { [itemId: string]: string }>;
  assignments: StudentEvaluationAssignment[];
}

const ManualEntryTable: React.FC<ManualEntryTableProps> = ({ evaluation, students, seed, existingResponses, assignments }) => {
  const questions = evaluation.evaluation_content_blocks
    .flatMap(b => b.evaluacion_items)
    .sort((a, b) => a.orden - b.orden);

  const [studentRows, setStudentRows] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialRows: Record<string, string> = {};
    assignments.forEach(a => {
      if (a.seed === seed) {
        initialRows[a.student_id] = a.assigned_row;
      }
    });
    students.forEach(s => {
      if (!initialRows[s.id]) {
        initialRows[s.id] = 'A'; // Default
      }
    });
    setStudentRows(initialRows);
  }, [assignments, students, seed]);

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
          {students.map(student => {
            const selectedRow = studentRows[student.id] || 'A';
            const isRowLocked = assignments.some(a => a.student_id === student.id && a.seed === seed);
            
            return (
              <StudentAnswerRow
                key={student.id}
                student={student}
                evaluation={evaluation}
                questions={questions}
                shuffledAlternativesMap={shuffledMaps[selectedRow] || {}}
                selectedRow={selectedRow}
                onRowChange={handleRowChange}
                isRowLocked={isRowLocked}
                existingAnswers={existingResponses.get(student.id)}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ManualEntryTable;
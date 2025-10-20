import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClassbookData } from '@/api/classbookApi';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClassbookTableProps {
  data: ClassbookData;
}

const ClassbookTable: React.FC<ClassbookTableProps> = ({ data }) => {
  const { students, evaluations, grades } = data;

  const sortedEvaluations = [...evaluations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const gradesMap = new Map<string, number>();
  grades.forEach(grade => {
    gradesMap.set(`${grade.student_id}-${grade.evaluation_id}`, grade.grade);
  });

  if (students.length === 0) {
    return <p className="text-center text-muted-foreground">Este curso no tiene estudiantes inscritos.</p>;
  }

  if (evaluations.length === 0) {
    return <p className="text-center text-muted-foreground">Este curso no tiene evaluaciones asignadas.</p>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-card z-10 min-w-[250px] border-r">Estudiante</TableHead>
            {sortedEvaluations.map(ev => (
              <TableHead key={ev.id} className="text-center min-w-[150px] align-bottom">
                <div className="flex flex-col items-center h-full justify-end">
                  <span className="font-semibold writing-mode-vertical-rl rotate-180 whitespace-nowrap">{ev.title}</span>
                  <span className="text-xs text-muted-foreground mt-2">{format(parseISO(ev.date), 'dd MMM', { locale: es })}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => (
            <TableRow key={student.id}>
              <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">{student.name}</TableCell>
              {sortedEvaluations.map(ev => {
                const grade = gradesMap.get(`${student.id}-${ev.id}`);
                return (
                  <TableCell key={ev.id} className="text-center">
                    {grade !== undefined ? (
                      <span className={cn("font-bold text-lg", grade < 4.0 ? "text-destructive" : "text-green-600")}>
                        {grade.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClassbookTable;
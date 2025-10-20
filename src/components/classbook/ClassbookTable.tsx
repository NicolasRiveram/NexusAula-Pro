import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { ClassbookData } from '@/api/classbookApi';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClassbookTableProps {
  data: ClassbookData;
}

const convertGradeToPercentage = (grade: number): number => {
  if (grade >= 4.0) {
    return (0.4 * (grade - 4.0) / 3.0 + 0.6) * 100;
  } else {
    return (0.6 * (grade - 1.0) / 3.0) * 100;
  }
};

const ClassbookTable: React.FC<ClassbookTableProps> = ({ data }) => {
  const { students, evaluations, grades } = data;

  const sortedEvaluations = [...evaluations].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  });

  const gradesMap = new Map<string, number>();
  grades.forEach(grade => {
    gradesMap.set(`${grade.student_id}-${grade.evaluation_id}`, grade.grade);
  });

  const evaluationAverages = sortedEvaluations.map(ev => {
    const gradesForEval = grades
      .filter(g => g.evaluation_id === ev.id)
      .map(g => g.grade);
    
    if (gradesForEval.length === 0) return 0;

    const percentages = gradesForEval.map(convertGradeToPercentage);
    const avgPercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return avgPercentage;
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
              <TableHead key={ev.id} className="text-center min-w-[150px] align-middle">
                <p className="font-semibold whitespace-normal">{ev.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ev.date ? format(parseISO(ev.date), 'dd MMM', { locale: es }) : 'Sin fecha'}
                </p>
              </TableHead>
            ))}
            <TableHead className="sticky right-[150px] bg-card z-10 min-w-[150px] border-l text-center">Promedio Sumativo</TableHead>
            <TableHead className="sticky right-0 bg-card z-10 min-w-[150px] border-l text-center">Promedio Formativo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map(student => {
            const summativeGrades: number[] = [];
            const formativeGrades: number[] = [];

            sortedEvaluations.forEach(ev => {
              const grade = gradesMap.get(`${student.id}-${ev.id}`);
              if (grade !== undefined) {
                if (ev.type === 'rubric' || ev.momento_evaluativo === 'sumativa') {
                  summativeGrades.push(grade);
                } else if (ev.momento_evaluativo === 'formativa') {
                  formativeGrades.push(grade);
                }
              }
            });

            const summativeAvg = summativeGrades.length > 0 ? (summativeGrades.reduce((a, b) => a + b, 0) / summativeGrades.length).toFixed(1) : '-';
            const formativeAvg = formativeGrades.length > 0 ? (formativeGrades.reduce((a, b) => a + b, 0) / formativeGrades.length).toFixed(1) : '-';

            return (
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
                <TableCell className={cn("font-bold text-lg text-center sticky right-[150px] bg-card z-10 border-l", parseFloat(summativeAvg) < 4.0 ? "text-destructive" : "text-green-600")}>{summativeAvg}</TableCell>
                <TableCell className={cn("font-bold text-lg text-center sticky right-0 bg-card z-10 border-l", parseFloat(formativeAvg) < 4.0 ? "text-destructive" : "text-green-600")}>{formativeAvg}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold sticky left-0 bg-card z-10 border-r">Promedio de Logro (%)</TableCell>
            {evaluationAverages.map((avg, index) => (
              <TableCell key={index} className="text-center font-bold">
                {avg > 0 ? `${avg.toFixed(1)}%` : '-'}
              </TableCell>
            ))}
            <TableCell className="sticky right-[150px] bg-card z-10 border-l" />
            <TableCell className="sticky right-0 bg-card z-10 border-l" />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ClassbookTable;
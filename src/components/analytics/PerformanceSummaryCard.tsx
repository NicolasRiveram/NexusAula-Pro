import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentPerformance } from '@/api/analyticsApi';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

interface PerformanceSummaryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  students: StudentPerformance[];
}

const PerformanceSummaryCard: React.FC<PerformanceSummaryCardProps> = ({ title, description, icon, students }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length > 0 ? (
          <ul className="space-y-4">
            {students.map(student => (
              <li key={student.student_id}>
                <Link to={`/dashboard/estudiante/${student.student_id}`} className="block hover:bg-muted/50 p-2 rounded-md">
                  <div className="flex justify-between items-center">
                    <p className="font-medium text-sm">{student.student_name}</p>
                    <p className="font-semibold text-sm">{student.average_score.toFixed(1)}%</p>
                  </div>
                  <Progress value={student.average_score} className="mt-1 h-2" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">No hay datos suficientes.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceSummaryCard;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ItemAnalysisResult } from '@/api/evaluationsApi';

interface ItemAnalysisProps {
  analysis: ItemAnalysisResult[];
}

const ItemAnalysis: React.FC<ItemAnalysisProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análisis por Pregunta</CardTitle>
        <CardDescription>Rendimiento de los estudiantes en cada una de las preguntas.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pregunta</TableHead>
              <TableHead className="text-center">Respuestas Correctas</TableHead>
              <TableHead className="w-[200px]">Porcentaje de Acierto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.map((item, index) => (
              <TableRow key={item.item_id}>
                <TableCell className="font-medium">
                  <p className="truncate max-w-xs">{index + 1}. {item.item_enunciado}</p>
                </TableCell>
                <TableCell className="text-center">
                  {item.correct_answers_count} / {item.total_answers_count}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={item.correct_percentage} className="w-full" />
                    <span className="text-sm font-semibold">{item.correct_percentage.toFixed(0)}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ItemAnalysis;
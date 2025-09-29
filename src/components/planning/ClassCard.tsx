import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScheduledClass } from '@/api/planningApi';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ClassCardProps {
  clase: ScheduledClass;
  onClick: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ clase, onClick }) => {
  const cardClass = cn(
    "cursor-pointer hover:shadow-md transition-shadow h-full",
    clase.estado === 'realizada' && 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    clase.estado === 'cancelada' && 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 opacity-70'
  );

  return (
    <Card onClick={onClick} className={cardClass}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{clase.titulo}</CardTitle>
          {clase.estado === 'realizada' && <Badge variant="secondary" className="bg-green-100 text-green-800">Realizada</Badge>}
        </div>
        <CardDescription>
          {format(parseISO(clase.fecha), "EEEE d 'de' LLLL", { locale: es })}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export default ClassCard;
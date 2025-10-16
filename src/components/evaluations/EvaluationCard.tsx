import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Eye, Printer, FileText, ClipboardList, BarChart, Camera, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Evaluation } from '@/api/evaluations';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatEvaluationType } from '@/utils/evaluationUtils';
import { useNavigate } from 'react-router-dom';

interface EvaluationCardProps {
  evaluation: Evaluation;
  isSelected: boolean;
  onSelectionChange: (id: string, selected: boolean) => void;
  onViewDetails: (id: string) => void;
  onViewResults: (id: string) => void;
  onShowAnswerKey: (id: string) => void;
  onPrint: (id: string) => void;
  onPrintAnswerSheet: (id: string) => void;
  onDelete: (evaluation: Evaluation) => void;
  onCorrectWithCamera: (id: string) => void;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({
  evaluation,
  isSelected,
  onSelectionChange,
  onViewDetails,
  onViewResults,
  onShowAnswerKey,
  onPrint,
  onPrintAnswerSheet,
  onDelete,
  onCorrectWithCamera,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative group">
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectionChange(evaluation.id, !!checked)}
          className="bg-white"
        />
      </div>
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
        <CardHeader className="cursor-pointer" onClick={() => onViewDetails(evaluation.id)}>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-8">
              <CardTitle>{evaluation.titulo}</CardTitle>
              <CardDescription>
                Aplicación: {evaluation.fecha_aplicacion ? format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es }) : 'Sin fecha definida'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails(evaluation.id)}><Eye className="mr-2 h-4 w-4" /> Ver / Editar Contenido</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewResults(evaluation.id)}><BarChart className="mr-2 h-4 w-4" /> Ver Resultados</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShowAnswerKey(evaluation.id)}><ClipboardList className="mr-2 h-4 w-4" /> Ver Pauta</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onPrint(evaluation.id)}><Printer className="mr-2 h-4 w-4" /> Imprimir Evaluación</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPrintAnswerSheet(evaluation.id)}><FileText className="mr-2 h-4 w-4" /> Imprimir Hoja de Respuestas</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(evaluation)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-grow cursor-pointer" onClick={() => onViewDetails(evaluation.id)}>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Badge variant="secondary" className="capitalize">{formatEvaluationType(evaluation.tipo)}</Badge>
              {evaluation.momento_evaluativo && <Badge variant="outline" className="capitalize">{evaluation.momento_evaluativo}</Badge>}
            </div>
            <div className="flex flex-wrap gap-1">
              {evaluation.curso_asignaturas.map((ca, index) => (
                <Badge key={index} variant="outline">
                  {ca.curso.nivel.nombre} {ca.curso.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => onCorrectWithCamera(evaluation.id)} variant="secondary" className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Corregir con Cámara
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EvaluationCard;
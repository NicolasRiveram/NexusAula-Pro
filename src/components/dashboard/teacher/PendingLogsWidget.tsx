import React, { useState } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { fetchClassesWithoutLog } from '@/api/planningApi';
import { Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ClassLogDialog from './ClassLogDialog';
import { AgendaClase } from '@/api/dashboardApi';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const PendingLogsWidget = () => {
  const { activeEstablishment } = useEstablishment();
  const [isLogDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<AgendaClase | null>(null);

  const { user } = useAuth();

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['pendingLogs', user?.id, activeEstablishment?.id],
    queryFn: () => fetchClassesWithoutLog(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const handleOpenLog = (clase: any) => {
    setSelectedClass({
      id: clase.id,
      titulo: clase.titulo,
      hora_inicio: '',
      hora_fin: '',
      curso_info: {
        nombre: clase.curso_info.nombre,
        nivel: clase.curso_info.nivel,
      }
    });
    setLogDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-24"><Loader2 className="animate-spin" /></div>;
  }

  if (!classes || classes.length === 0) {
    return <p className="text-center text-sm text-muted-foreground">¡Felicitaciones! Todas tus bitácoras están al día.</p>;
  }

  return (
    <>
      <div className="space-y-2">
        {classes.map(clase => (
          <div key={clase.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
            <div>
              <span className="font-medium">{clase.titulo}</span>
              <span className="text-muted-foreground ml-2">({format(parseISO(clase.fecha), "d LLL", { locale: es })})</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleOpenLog(clase)}>
              <BookOpen className="h-4 w-4 mr-2" /> Registrar
            </Button>
          </div>
        ))}
      </div>
      <ClassLogDialog
        isOpen={isLogDialogOpen}
        onClose={() => { setLogDialogOpen(false); refetch(); }}
        clase={selectedClass}
      />
    </>
  );
};

export default PendingLogsWidget;
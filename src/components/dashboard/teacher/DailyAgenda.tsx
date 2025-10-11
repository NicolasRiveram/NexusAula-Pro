import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, FileText, Megaphone, Loader2, BookOpen } from 'lucide-react';
import { fetchDashboardDataForDay, DailyAgendaData, AgendaClase } from '@/api/dashboardApi';
import { showError } from '@/utils/toast';
import { Establishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import ClassLogDialog from './ClassLogDialog';
import { useQuery } from '@tanstack/react-query';

interface DailyAgendaProps {
  selectedDate: Date;
  activeEstablishment: Establishment | null;
}

const DailyAgenda: React.FC<DailyAgendaProps> = ({ selectedDate, activeEstablishment }) => {
  const [isLogDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedClassForLog, setSelectedClassForLog] = useState<AgendaClase | null>(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    }
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dailyAgenda', user?.id, activeEstablishment?.id, selectedDate.toDateString()],
    queryFn: () => fetchDashboardDataForDay(user!.id, activeEstablishment!.id, selectedDate),
    enabled: !!user && !!activeEstablishment,
  });

  useEffect(() => {
    if (isError) {
      showError(`Error al cargar la agenda: ${(error as Error).message}`);
    }
  }, [isError, error]);

  const handleOpenLog = (clase: AgendaClase) => {
    setSelectedClassForLog(clase);
    setLogDialogOpen(true);
  };

  const formattedDate = format(selectedDate, "EEEE, d 'de' LLLL", { locale: es });

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="capitalize">{formattedDate}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !activeEstablishment ? (
            <p className="text-muted-foreground text-center">Selecciona un establecimiento para ver la agenda.</p>
          ) : !data ? (
             <p className="text-muted-foreground text-center">No hay datos de agenda para este día.</p>
          ) : (
            <div className="space-y-6">
              {data.anuncios.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center"><Megaphone className="mr-2 h-5 w-5 text-primary" /> Anuncios del Día</h3>
                  {data.anuncios.map(anuncio => (
                    <div key={anuncio.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <p className="font-bold text-sm">{anuncio.titulo}</p>
                      <p className="text-sm text-muted-foreground">{anuncio.mensaje}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Clases Programadas</h3>
                {data.clases.length > 0 ? (
                  data.clases.map(clase => (
                    <div key={clase.id} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50">
                      <div>
                        <span>{clase.hora_inicio} - {clase.hora_fin}</span>
                        <span className="font-medium ml-4">{clase.titulo}</span>
                        <span className="text-muted-foreground ml-2">{clase.curso_info.nivel} {clase.curso_info.nombre}</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenLog(clase)}>
                        <BookOpen className="h-4 w-4 mr-2" /> Bitácora
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay clases programadas para este día.</p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Evaluaciones</h3>
                {data.evaluaciones.length > 0 ? (
                  data.evaluaciones.map(evaluacion => (
                    <div key={evaluacion.id} className="text-sm">
                      <p className="font-medium">{evaluacion.titulo} <span className="font-normal text-muted-foreground">({evaluacion.tipo})</span></p>
                      <p className="text-xs text-muted-foreground">{evaluacion.curso_info.nivel} {evaluacion.curso_info.nombre}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay evaluaciones para hoy.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ClassLogDialog
        isOpen={isLogDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        clase={selectedClassForLog}
      />
    </>
  );
};

export default DailyAgenda;
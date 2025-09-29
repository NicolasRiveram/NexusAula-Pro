import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, FileText, Megaphone, Loader2 } from 'lucide-react';
import { fetchDashboardDataForDay, DailyAgendaData } from '@/api/dashboardApi';
import { showError } from '@/utils/toast';
import { Establishment } from '@/contexts/EstablishmentContext';

interface DailyAgendaProps {
  selectedDate: Date;
  activeEstablishment: Establishment | null;
}

const DailyAgenda: React.FC<DailyAgendaProps> = ({ selectedDate, activeEstablishment }) => {
  const [data, setData] = useState<DailyAgendaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAgenda = async () => {
      if (!activeEstablishment) {
        setData(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const agendaData = await fetchDashboardDataForDay(user.id, activeEstablishment.id, selectedDate);
          setData(agendaData);
        } catch (err: any) {
          showError(`Error al cargar la agenda: ${err.message}`);
          setData(null);
        }
      }
      setLoading(false);
    };
    loadAgenda();
  }, [selectedDate, activeEstablishment]);

  const formattedDate = format(selectedDate, "EEEE, d 'de' LLLL", { locale: es });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="capitalize">{formattedDate}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !data ? (
          <p className="text-muted-foreground text-center">Selecciona un establecimiento para ver la agenda.</p>
        ) : (
          <div className="space-y-6">
            {/* Anuncios */}
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

            {/* Clases */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Clases Programadas</h3>
              {data.clases.length > 0 ? (
                data.clases.map(clase => (
                  <div key={clase.id} className="flex items-center justify-between text-sm">
                    <span>{clase.hora_inicio} - {clase.hora_fin}</span>
                    <span className="font-medium">{clase.titulo}</span>
                    <span className="text-muted-foreground">{clase.curso_info.nivel} {clase.curso_info.nombre}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay clases programadas para este día.</p>
              )}
            </div>

            {/* Evaluaciones */}
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
  );
};

export default DailyAgenda;
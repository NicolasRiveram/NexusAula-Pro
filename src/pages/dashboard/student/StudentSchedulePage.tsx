import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { fetchStudentWeeklySchedule, StudentScheduleBlock } from '@/api/studentApi';
import { showError } from '@/utils/toast';

const diasSemana = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const StudentSchedulePage = () => {
  const [schedule, setSchedule] = useState<StudentScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadSchedule = async () => {
      if (!activeEstablishment) {
        setSchedule([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const scheduleData = await fetchStudentWeeklySchedule(user.id, activeEstablishment.id);
          setSchedule(scheduleData);
        } catch (error: any) {
          showError(`Error al cargar el horario: ${error.message}`);
        }
      }
      setLoading(false);
    };
    loadSchedule();
  }, [activeEstablishment]);

  const groupedSchedule = schedule.reduce((acc, block) => {
    (acc[block.dia_semana] = acc[block.dia_semana] || []).push(block);
    return acc;
  }, {} as Record<number, StudentScheduleBlock[]>);

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Horario Semanal</h1>
        <p className="text-muted-foreground">Este es tu horario de clases para la semana.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver tu horario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {diasSemana.slice(1).map((dia, index) => {
            const diaNum = index + 1;
            const bloques = (groupedSchedule[diaNum] || []).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
            return (
              <Card key={dia}>
                <CardHeader>
                  <CardTitle>{dia}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bloques.length > 0 ? (
                    bloques.map(block => (
                      <div key={block.id} className="p-3 bg-muted/50 rounded-md">
                        <p className="font-semibold">{block.hora_inicio} - {block.hora_fin}</p>
                        <p className="text-sm font-medium">{block.asignatura_nombre}</p>
                        <p className="text-xs text-muted-foreground">{block.nivel_nombre} {block.curso_nombre}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Sin clases</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSchedulePage;
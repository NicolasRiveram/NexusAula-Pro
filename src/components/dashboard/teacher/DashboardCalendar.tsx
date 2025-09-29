import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { es } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { fetchClassesForMonth, ScheduledClass } from '@/api/planningApi';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

const DashboardCalendar = () => {
  const [month, setMonth] = useState(new Date());
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadClasses = async () => {
      if (!activeEstablishment) {
        setClasses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const data = await fetchClassesForMonth(user.id, activeEstablishment.id, month);
          setClasses(data);
        } catch (err: any) {
          showError(`Error al cargar clases: ${err.message}`);
        }
      }
      setLoading(false);
    };
    loadClasses();
  }, [month, activeEstablishment]);

  const classesByDay = useMemo(() => {
    return classes.reduce((acc, cls) => {
      const day = format(parseISO(cls.fecha), 'yyyy-MM-dd');
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(cls);
      return acc;
    }, {} as Record<string, ScheduledClass[]>);
  }, [classes]);

  const daysWithClasses = useMemo(() => {
    return Object.keys(classesByDay).map(dayStr => new Date(dayStr + 'T00:00:00'));
  }, [classesByDay]);

  const DayWithPopover = ({ date, displayMonth }: { date: Date, displayMonth: Date }) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const dayClasses = classesByDay[dayStr];

    if (!dayClasses) {
      return <div>{format(date, 'd')}</div>;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative w-full h-full flex items-center justify-center cursor-pointer">
            {format(date, 'd')}
            <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{format(date, "EEEE, d 'de' LLLL", { locale: es })}</h4>
            <div className="space-y-2 pt-2">
              {dayClasses.map(cls => (
                <Link to={`/dashboard/planificacion/${cls.id}`} key={cls.id} className="block p-2 rounded-md hover:bg-accent">
                  <p className="text-sm font-semibold">{cls.titulo}</p>
                  <Badge variant="secondary" className="mt-1">{cls.curso_info.nivel} {cls.curso_info.nombre}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Clases</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          locale={es}
          className="p-0"
          modifiers={{ hasClass: daysWithClasses }}
          modifiersStyles={{ hasClass: { fontWeight: 'bold' } }}
          components={{
            Day: DayWithPopover,
          }}
        />
      </CardContent>
    </Card>
  );
};

export default DashboardCalendar;
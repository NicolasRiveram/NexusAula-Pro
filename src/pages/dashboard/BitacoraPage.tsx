import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchClassLogsForTeacher, ClassLogEntry } from '@/api/planningApi';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const BitacoraPage = () => {
  const [logs, setLogs] = useState<ClassLogEntry[]>([]);
  const [cursos, setCursos] = useState<CursoAsignatura[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadData = async () => {
      if (!activeEstablishment) {
        setLogs([]);
        setCursos([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const [logsData, cursosData] = await Promise.all([
            fetchClassLogsForTeacher(user.id, activeEstablishment.id),
            fetchCursosAsignaturasDocente(user.id, activeEstablishment.id),
          ]);
          setLogs(logsData);
          setCursos(cursosData);
        } catch (error: any) {
          showError(`Error al cargar los datos: ${error.message}`);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [activeEstablishment]);

  const filteredLogs = useMemo(() => {
    if (selectedCurso === 'todos') {
      return logs;
    }
    return logs.filter(log => log.curso_asignatura_id === selectedCurso);
  }, [logs, selectedCurso]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bitácora de Clases</h1>
          <p className="text-muted-foreground">Consulta el historial de tus clases registradas.</p>
        </div>
        <div className="w-64">
          <Select value={selectedCurso} onValueChange={setSelectedCurso}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por curso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los cursos</SelectItem>
              {cursos.map(curso => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.curso.nivel.nombre} {curso.curso.nombre} - {curso.asignatura.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p>Cargando bitácoras...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver tus bitácoras.</p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="space-y-4">
          {filteredLogs.map(log => (
            <Card key={log.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{log.curso_info.nivel} {log.curso_info.nombre} - {log.curso_info.asignatura}</CardTitle>
                    <CardDescription>{format(parseISO(log.fecha), "EEEE, d 'de' LLLL 'de' yyyy", { locale: es })}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">Contenido Cubierto</h4>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{log.bitacora_contenido_cubierto}</p>
                </div>
                {log.bitacora_observaciones && (
                  <div>
                    <h4 className="font-semibold text-sm">Observaciones</h4>
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{log.bitacora_observaciones}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No hay bitácoras para mostrar</h3>
          <p className="text-muted-foreground mt-2">
            {selectedCurso === 'todos' ? 'Aún no has registrado ninguna bitácora.' : 'No hay bitácoras para el curso seleccionado.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default BitacoraPage;
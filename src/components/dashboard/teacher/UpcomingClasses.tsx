import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Clase {
  id: string;
  fecha: string;
  titulo: string;
  unidades: {
    curso_asignaturas: {
      cursos: { nombre: string };
      asignaturas: { nombre: string };
    }
  } | null;
}

const UpcomingClasses = () => {
  const [clases, setClases] = useState<Clase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClases = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('planificaciones_clase')
        .select(`
          id,
          fecha,
          titulo,
          unidades (
            curso_asignaturas (
              cursos (nombre),
              asignaturas (nombre)
            )
          )
        `)
        .gte('fecha', today)
        .order('fecha', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching upcoming classes:', error);
      } else if (data) {
        // Este es un placeholder. En una implementación real, filtraríamos por `docente_id`.
        // Por ahora, mostramos las próximas 5 clases del sistema.
        setClases(data as any);
      }
      setLoading(false);
    };

    fetchClases();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2" /> Próximas Clases
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando clases...</p>
        ) : clases.length > 0 ? (
          <div className="space-y-4">
            {clases.map((clase) => (
              <Link to={`/dashboard/planificacion/${clase.id}`} key={clase.id} className="block hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{clase.titulo}</p>
                    <p className="text-sm text-muted-foreground">
                      {clase.unidades?.curso_asignaturas?.cursos?.nombre || 'Curso no especificado'} - {clase.unidades?.curso_asignaturas?.asignaturas?.nombre || 'Asignatura no especificada'}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <p>{new Date(clase.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p>No tienes clases programadas próximamente.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingClasses;
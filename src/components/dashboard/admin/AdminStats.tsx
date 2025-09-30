import React, { useState, useEffect } from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserPlus, School } from 'lucide-react';
import { fetchEstablishmentStats, EstablishmentStats } from '@/api/adminApi';
import { Skeleton } from '@/components/ui/skeleton';

const AdminStats = () => {
  const { activeEstablishment } = useEstablishment();
  const [stats, setStats] = useState<EstablishmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (activeEstablishment) {
        setLoading(true);
        try {
          const data = await fetchEstablishmentStats(activeEstablishment.id);
          setStats(data);
        } catch (error) {
          console.error(error);
          setStats(null);
        } finally {
          setLoading(false);
        }
      }
    };
    loadStats();
  }, [activeEstablishment]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Docentes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.docentes ?? 0}</div>
          <p className="text-xs text-muted-foreground">Profesores activos en el establecimiento</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estudiantes</CardTitle>
          <School className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.estudiantes ?? 0}</div>
          <p className="text-xs text-muted-foreground">Estudiantes inscritos en cursos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cursos Activos</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.cursos ?? 0}</div>
          <p className="text-xs text-muted-foreground">Cursos creados para el año actual</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
          <UserPlus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.pendientes ?? 0}</div>
          <p className="text-xs text-muted-foreground">Nuevos usuarios esperando aprobación</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
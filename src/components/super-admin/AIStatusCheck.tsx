import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { checkAIHealth } from '@/api/superAdminApi';
import { useQuery } from '@tanstack/react-query';

const AIStatusCheck = () => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['aiHealthCheck'],
    queryFn: checkAIHealth,
    refetchOnWindowFocus: false, // Don't spam the health check
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const status = isError ? 'error' : data?.status === 'ok' ? 'active' : 'unknown';
  const testResult = isError ? `Error: ${error.message}` : data?.message;

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary">Verificando...</Badge>;
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Activo</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Estado de la Inteligencia Artificial</CardTitle>
            <CardDescription>Verifica la conexión y el funcionamiento del servicio de IA.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Estado:</span>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => refetch()} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {isLoading ? 'Probando...' : 'Probar Conexión con IA'}
        </Button>
        {testResult && (
          <div className="p-4 bg-muted rounded-md">
            <p className="text-sm font-semibold mb-2">Resultado de la última prueba:</p>
            <blockquote className="border-l-2 pl-4 italic text-muted-foreground">
              {testResult}
            </blockquote>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIStatusCheck;
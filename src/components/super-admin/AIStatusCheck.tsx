import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

type AIStatus = 'unknown' | 'active' | 'error';

const AIStatusCheck = () => {
  const [status, setStatus] = useState<AIStatus>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión de usuario activa.");

      const { data, error } = await supabase.functions.invoke('ai-health-check', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;

      if (data.status === 'ok') {
        setStatus('active');
        setTestResult(data.message);
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      setStatus('error');
      setTestResult(`Error: ${error.message}`);
      showError("La prueba de conexión con la IA falló.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Activo</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Verificando...</Badge>;
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
        <Button onClick={runHealthCheck} disabled={isLoading}>
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
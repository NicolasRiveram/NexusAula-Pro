import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { fetchReportById, Report } from '@/api/reportsApi';
import { showError } from '@/utils/toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { printComponent } from '@/utils/printUtils';
import PrintableReport from '@/components/reports/PrintableReport';

const ViewReportPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reportId) {
      setLoading(true);
      fetchReportById(reportId)
        .then(setReport)
        .catch(err => showError(err.message))
        .finally(() => setLoading(false));
    }
  }, [reportId]);

  const handlePrint = () => {
    if (report) {
      printComponent(
        <PrintableReport report={report} />,
        `Informe - ${report.perfiles.nombre_completo}`,
        'portrait'
      );
    }
  };

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!report) {
    return <div className="container mx-auto"><p>Informe no encontrado.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/dashboard/informes" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Informes
        </Link>
        <Button onClick={handlePrint}><Download className="mr-2 h-4 w-4" /> Descargar PDF</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Informe Pedagógico de {report.perfiles.nombre_completo}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="docente">
            <TabsList>
              <TabsTrigger value="docente">Informe para Docente</TabsTrigger>
              <TabsTrigger value="apoderado">Comunicado para Apoderado</TabsTrigger>
            </TabsList>
            <TabsContent value="docente" className="prose dark:prose-invert max-w-none mt-4 p-4 border rounded-md">
              <div dangerouslySetInnerHTML={{ __html: report.informe_docente_html }} />
            </TabsContent>
            <TabsContent value="apoderado" className="prose dark:prose-invert max-w-none mt-4 p-4 border rounded-md">
              <div dangerouslySetInnerHTML={{ __html: report.comunicado_apoderado_html }} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ViewReportPage;
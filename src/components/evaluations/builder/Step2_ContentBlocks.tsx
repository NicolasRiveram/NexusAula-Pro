import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Trash2, Loader2 } from 'lucide-react';
import { fetchContentBlocks, deleteContentBlock, EvaluationContentBlock } from '@/api/evaluationsApi';
import { showError, showSuccess } from '@/utils/toast';
import AddTextBlockDialog from './AddTextBlockDialog';

interface Step2ContentBlocksProps {
  evaluationId: string;
  evaluationTitle: string;
}

const Step2ContentBlocks: React.FC<Step2ContentBlocksProps> = ({ evaluationId, evaluationTitle }) => {
  const [blocks, setBlocks] = useState<EvaluationContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddTextDialogOpen, setAddTextDialogOpen] = useState(false);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchContentBlocks(evaluationId);
      setBlocks(data);
    } catch (error: any) {
      showError(`Error al cargar bloques: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteContentBlock(blockId);
      showSuccess("Bloque eliminado.");
      loadBlocks();
    } catch (error: any) {
      showError(`Error al eliminar el bloque: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bloques de Contenido para "{evaluationTitle}"</h3>
      <div className="flex gap-2">
        <Button onClick={() => setAddTextDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Temario/Texto
        </Button>
        {/* Otros botones para añadir bloques irán aquí */}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : blocks.length > 0 ? (
        <div className="space-y-4">
          {blocks.map(block => (
            <Card key={block.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">Bloque de Texto</CardTitle>
                    <CardDescription>Orden: {block.orden}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(block.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{block.content.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Sin contenido</h3>
          <p className="text-muted-foreground mt-2">Añade tu primer bloque de contenido para empezar a generar preguntas.</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button disabled={blocks.length === 0}>
          Continuar a Generar Preguntas
        </Button>
      </div>

      <AddTextBlockDialog
        isOpen={isAddTextDialogOpen}
        onClose={() => setAddTextDialogOpen(false)}
        onBlockCreated={loadBlocks}
        evaluationId={evaluationId}
        currentOrder={blocks.length + 1}
      />
    </div>
  );
};

export default Step2ContentBlocks;
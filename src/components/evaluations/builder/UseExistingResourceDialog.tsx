import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { fetchEvaluations, Evaluation } from '@/api/evaluations';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { formatEvaluationType } from '@/utils/evaluationUtils';

interface UseExistingResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceSelected: (resourceId: string) => void;
  currentEvaluationId: string;
}

const UseExistingResourceDialog: React.FC<UseExistingResourceDialogProps> = ({ isOpen, onClose, onResourceSelected, currentEvaluationId }) => {
  const { activeEstablishment } = useEstablishment();
  const [resources, setResources] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      if (isOpen && activeEstablishment) {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const data = await fetchEvaluations(user.id, activeEstablishment.id);
            // Filter out the current evaluation to prevent self-import
            setResources(data.filter(r => r.id !== currentEvaluationId));
          } catch (err: any) {
            showError(`Error al cargar recursos: ${err.message}`);
          }
        }
        setLoading(false);
      }
    };
    loadResources();
  }, [isOpen, activeEstablishment, currentEvaluationId]);

  const handleSelect = (resourceId: string) => {
    onResourceSelected(resourceId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reutilizar Recurso Existente</DialogTitle>
          <DialogDescription>
            Selecciona una evaluación o guía para importar su contenido a la evaluación actual.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Buscar por título..." />
          <CommandList>
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontraron recursos.</CommandEmpty>
                <CommandGroup heading="Tus Evaluaciones y Guías">
                  {resources.map((resource) => (
                    <CommandItem
                      key={resource.id}
                      value={resource.titulo}
                      onSelect={() => handleSelect(resource.id)}
                      className="cursor-pointer"
                    >
                      <div>
                        <p>{resource.titulo} <span className="text-xs text-muted-foreground">({formatEvaluationType(resource.tipo)})</span></p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(resource.fecha_aplicacion), "d 'de' LLL, yyyy", { locale: es })}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default UseExistingResourceDialog;
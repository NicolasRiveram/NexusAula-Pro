import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { fetchUnitPlans, UnitPlan } from '@/api/planningApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface UseDidacticPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanSelected: (plan: UnitPlan) => void;
}

const UseDidacticPlanDialog: React.FC<UseDidacticPlanDialogProps> = ({ isOpen, onClose, onPlanSelected }) => {
  const { activeEstablishment } = useEstablishment();
  const [plans, setPlans] = useState<UnitPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      if (isOpen && activeEstablishment) {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const data = await fetchUnitPlans(user.id);
            // Filter plans for the active establishment client-side
            const filteredPlans = data.filter(plan =>
              plan.unidad_maestra_curso_asignatura_link.some(link =>
                link.curso_asignaturas?.cursos?.establecimiento_id === activeEstablishment.id
              )
            );
            setPlans(filteredPlans);
          } catch (err: any) {
            showError(`Error al cargar planes: ${err.message}`);
          }
        }
        setLoading(false);
      }
    };
    loadPlans();
  }, [isOpen, activeEstablishment]);

  const handleSelect = (plan: UnitPlan) => {
    onPlanSelected(plan);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Usar Plan Didáctico Existente</DialogTitle>
          <DialogDescription>
            Selecciona uno de tus planes de unidad para usar su contenido como base para las preguntas.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border shadow-md">
          <CommandInput placeholder="Buscar plan por título..." />
          <CommandList>
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>No se encontraron planes.</CommandEmpty>
                <CommandGroup heading="Tus Planes de Unidad">
                  {plans.map((plan) => (
                    <CommandItem
                      key={plan.id}
                      value={plan.titulo}
                      onSelect={() => handleSelect(plan)}
                      className="cursor-pointer"
                    >
                      <div>
                        <p>{plan.titulo}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(plan.fecha_inicio), "d LLL", { locale: es })} - {format(parseISO(plan.fecha_fin), "d LLL, yyyy", { locale: es })}
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

export default UseDidacticPlanDialog;
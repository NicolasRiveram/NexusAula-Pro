import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showError } from '@/utils/toast';

interface AskClassCountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
}

const AskClassCountDialog: React.FC<AskClassCountDialogProps> = ({ isOpen, onClose, onConfirm }) => {
  const [count, setCount] = useState(10);

  const handleConfirm = () => {
    if (count > 0 && count <= 50) { // Set a reasonable limit
      onConfirm(count);
    } else {
      showError("Por favor, ingresa un número de clases entre 1 y 50.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>No se encontró un horario</DialogTitle>
          <DialogDescription>
            No se encontraron bloques de clases en tu horario para el período seleccionado.
            Por favor, indica cuántas clases de ejemplo deseas generar como plantillas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="class-count">Número de Clases a Generar</Label>
          <Input
            id="class-count"
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 0)}
            min="1"
            max="50"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Generar Clases</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AskClassCountDialog;
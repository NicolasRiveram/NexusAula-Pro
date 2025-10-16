import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import { updateDesignSetting, uploadDesignAsset, getDesignAssetUrl, removeDesignAsset, DesignSetting } from '@/api/designApi';
import { showError, showSuccess } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DesignZoneProps {
  setting: DesignSetting;
}

const DesignZone: React.FC<DesignZoneProps> = ({ setting }) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (setting.value) {
      setPreview(getDesignAssetUrl(setting.value));
    } else {
      setPreview(null);
    }
  }, [setting.value]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Por favor, selecciona un archivo para subir.");
      if (setting.value) {
        await removeDesignAsset(setting.value);
      }
      const newPath = await uploadDesignAsset(file);
      await updateDesignSetting(setting.key, newPath);
    },
    onSuccess: () => {
      showSuccess("Imagen actualizada correctamente.");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['designSettings'] });
    },
    onError: (error: any) => showError(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!setting.value) return;
      await removeDesignAsset(setting.value);
      await updateDesignSetting(setting.key, null);
    },
    onSuccess: () => {
      showSuccess("Imagen eliminada.");
      setFile(null);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['designSettings'] });
    },
    onError: (error: any) => showError(error.message),
  });

  const handleRemove = () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      removeMutation.mutate();
    }
  };

  const isMutating = saveMutation.isPending || removeMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{setting.description}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {preview && (
          <div>
            <Label>Vista Previa Actual</Label>
            <div className="mt-2 w-full h-48 flex items-center justify-center border rounded-md overflow-hidden bg-muted">
              <img src={preview} alt="Vista previa" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
        )}
        <div>
          <Label htmlFor={`upload-${setting.key}`}>Subir nueva imagen</Label>
          <Input id={`upload-${setting.key}`} type="file" accept="image/*" onChange={handleFileChange} />
        </div>
        <div className="flex justify-end gap-2">
          {setting.value && (
            <Button variant="destructive" onClick={handleRemove} disabled={isMutating}>
              {removeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <Button onClick={() => saveMutation.mutate()} disabled={!file || isMutating}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DesignZone;
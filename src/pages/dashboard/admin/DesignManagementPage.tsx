import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2 } from 'lucide-react';
import { fetchDesignSettings, updateDesignSetting, uploadDesignAsset, getDesignAssetUrl, removeDesignAsset, DesignSetting } from '@/api/designApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';

interface DesignZoneProps {
  setting: DesignSetting;
  onUpdate: () => void;
}

const DesignZone: React.FC<DesignZoneProps> = ({ setting, onUpdate }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSave = async () => {
    if (!file) {
      showError("Por favor, selecciona un archivo para subir.");
      return;
    }
    setIsUploading(true);
    const toastId = showLoading("Subiendo imagen...");
    try {
      if (setting.value) {
        await removeDesignAsset(setting.value);
      }
      const newPath = await uploadDesignAsset(file);
      await updateDesignSetting(setting.key, newPath);
      dismissToast(toastId);
      showSuccess("Imagen actualizada correctamente.");
      setFile(null);
      onUpdate();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!setting.value) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta imagen?")) return;
    
    setIsUploading(true);
    const toastId = showLoading("Eliminando imagen...");
    try {
      await removeDesignAsset(setting.value);
      await updateDesignSetting(setting.key, null);
      dismissToast(toastId);
      showSuccess("Imagen eliminada.");
      setFile(null);
      setPreview(null);
      onUpdate();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
            <Button variant="destructive" onClick={handleRemove} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Eliminar
            </Button>
          )}
          <Button onClick={handleSave} disabled={!file || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DesignManagementPage = () => {
  const [settings, setSettings] = useState<DesignSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchDesignSettings();
      setSettings(data);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Diseño</h1>
        <p className="text-muted-foreground">Personaliza la apariencia de la aplicación subiendo imágenes para diferentes zonas.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map(setting => (
          <DesignZone key={setting.key} setting={setting} onUpdate={loadSettings} />
        ))}
      </div>
    </div>
  );
};

export default DesignManagementPage;
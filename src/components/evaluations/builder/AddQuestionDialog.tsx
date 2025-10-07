import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2 } from 'lucide-react';
import { saveManualQuestion, ManualQuestionData, fetchSkills, Skill } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const alternativeSchema = z.object({
  texto: z.string().min(1, "El texto no puede estar vacío."),
});

const schema = z.object({
  tipo_item: z.enum(['seleccion_multiple', 'verdadero_falso', 'desarrollo']),
  enunciado: z.string().min(10, "El enunciado es muy corto."),
  puntaje: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  habilidad_evaluada: z.string().min(3, "La habilidad es requerida."),
  nivel_comprension: z.string().min(1, "El nivel de comprensión es requerido."),
  alternativas: z.array(alternativeSchema).optional(),
  correctAlternative: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.tipo_item === 'seleccion_multiple') {
    if (!data.alternativas || data.alternativas.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debe haber al menos 2 alternativas.", path: ['alternativas'] });
    }
    if (data.correctAlternative === undefined || data.correctAlternative === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes marcar una alternativa como correcta.", path: ['correctAlternative'] });
    }
  }
  if (data.tipo_item === 'verdadero_falso') {
    if (data.correctAlternative === undefined || data.correctAlternative === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Debes seleccionar si es verdadero o falso.", path: ['correctAlternative'] });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface AddQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  evaluationId: string;
  blockId: string;
}

const AddQuestionDialog: React.FC<AddQuestionDialogProps> = ({ isOpen, onClose, onSave, evaluationId, blockId }) => {
  const [questionType, setQuestionType] = useState<'seleccion_multiple' | 'verdadero_falso' | 'desarrollo'>('seleccion_multiple');
  const [skills, setSkills] = useState<Skill[]>([]);
  
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo_item: 'seleccion_multiple', puntaje: 1, alternativas: [{ texto: '' }, { texto: '' }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "alternativas" });
  const correctAlternativeIndex = watch('correctAlternative');

  useEffect(() => {
    if (isOpen) {
        fetchSkills()
            .then(setSkills)
            .catch(err => showError(`Error al cargar habilidades: ${err.message}`));
    }
  }, [isOpen]);

  useEffect(() => {
    reset({
      tipo_item: questionType,
      enunciado: '',
      puntaje: 1,
      habilidad_evaluada: undefined,
      nivel_comprension: undefined,
      alternativas: questionType === 'seleccion_multiple' ? [{ texto: '' }, { texto: '' }] : [],
      correctAlternative: undefined,
    });
  }, [questionType, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Guardando pregunta...");
    try {
      let questionPayload: ManualQuestionData = {
        enunciado: data.enunciado,
        tipo_item: data.tipo_item,
        puntaje: data.puntaje,
        habilidad_evaluada: data.habilidad_evaluada,
        nivel_comprension: data.nivel_comprension,
      };

      if (data.tipo_item === 'seleccion_multiple' && data.alternativas) {
        questionPayload.alternativas = data.alternativas.map((alt, index) => ({
          texto: alt.texto,
          es_correcta: index.toString() === data.correctAlternative,
          orden: index + 1,
        }));
      } else if (data.tipo_item === 'verdadero_falso') {
        questionPayload.alternativas = [
          { texto: 'Verdadero', es_correcta: data.correctAlternative === 'true', orden: 1 },
          { texto: 'Falso', es_correcta: data.correctAlternative === 'false', orden: 2 },
        ];
      }

      await saveManualQuestion(evaluationId, blockId, questionPayload);
      dismissToast(toastId);
      showSuccess("Pregunta guardada exitosamente.");
      onSave();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al guardar: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Añadir Pregunta Manual</DialogTitle>
          <DialogDescription>Crea una pregunta personalizada para este bloque de contenido.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="tipo_item">Tipo de Pregunta</Label>
            <Select onValueChange={(value) => setQuestionType(value as any)} value={questionType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="seleccion_multiple">Selección Múltiple</SelectItem>
                <SelectItem value="verdadero_falso">Verdadero/Falso</SelectItem>
                <SelectItem value="desarrollo">Desarrollo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="enunciado">Enunciado</Label>
            <Controller name="enunciado" control={control} render={({ field }) => <Textarea id="enunciado" rows={3} {...field} />} />
            {errors.enunciado && <p className="text-red-500 text-sm mt-1">{errors.enunciado.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="puntaje">Puntaje</Label>
              <Controller name="puntaje" control={control} render={({ field }) => <Input id="puntaje" type="number" {...field} />} />
              {errors.puntaje && <p className="text-red-500 text-sm mt-1">{errors.puntaje.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="habilidad_evaluada">Habilidad Evaluada</Label>
              <Controller
                name="habilidad_evaluada"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="Selecciona una habilidad" /></SelectTrigger>
                    <SelectContent>
                      {skills.map(skill => (
                        <SelectItem key={skill.id} value={skill.nombre}>{skill.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.habilidad_evaluada && <p className="text-red-500 text-sm mt-1">{errors.habilidad_evaluada.message}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="nivel_comprension">Nivel de Comprensión (Bloom)</Label>
            <Controller name="nivel_comprension" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recordar">Recordar</SelectItem>
                  <SelectItem value="Comprender">Comprender</SelectItem>
                  <SelectItem value="Aplicar">Aplicar</SelectItem>
                  <SelectItem value="Analizar">Analizar</SelectItem>
                  <SelectItem value="Evaluar">Evaluar</SelectItem>
                  <SelectItem value="Crear">Crear</SelectItem>
                </SelectContent>
              </Select>
            )} />
            {errors.nivel_comprension && <p className="text-red-500 text-sm mt-1">{errors.nivel_comprension.message}</p>}
          </div>

          {questionType === 'seleccion_multiple' && (
            <div>
              <Label>Alternativas (marca la correcta)</Label>
              <Controller
                name="correctAlternative"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2 mt-2">
                    {fields.map((fieldItem, index) => (
                      <div key={fieldItem.id} className="flex items-center gap-2">
                        <RadioGroupItem value={index.toString()} id={`alt-${index}`} />
                        <Controller
                          name={`alternativas.${index}.texto`}
                          control={control}
                          render={({ field: altField }) => <Input placeholder={`Alternativa ${String.fromCharCode(97 + index)}`} {...altField} />}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.alternativas && <p className="text-red-500 text-sm mt-1">{errors.alternativas.message || (errors.alternativas as any).root?.message}</p>}
              {errors.correctAlternative && <p className="text-red-500 text-sm mt-1">{errors.correctAlternative.message}</p>}
              <Button type="button" variant="outline" size="sm" onClick={() => append({ texto: '' })} className="mt-2">
                Añadir Alternativa
              </Button>
            </div>
          )}

          {questionType === 'verdadero_falso' && (
            <div>
              <Label>Respuesta Correcta</Label>
              <Controller
                name="correctAlternative"
                control={control}
                render={({ field }) => (
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="vf-true" />
                      <Label htmlFor="vf-true">Verdadero</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="vf-false" />
                      <Label htmlFor="vf-false">Falso</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.correctAlternative && <p className="text-red-500 text-sm mt-1">{errors.correctAlternative.message}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Pregunta'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionDialog;
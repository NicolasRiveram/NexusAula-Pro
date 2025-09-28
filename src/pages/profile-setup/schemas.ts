import * as z from 'zod';

export const step1Schema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido."),
  rol_seleccionado: z.enum(['docente', 'coordinador'], {
    required_error: "Debes seleccionar un rol.",
  }),
});

export const step2Schema = z.object({
  establecimiento_id: z.string().uuid().optional(),
  establecimiento_nombre: z.string().optional(), // Para el buscador
  new_establecimiento_nombre: z.string().optional(),
  new_establecimiento_direccion: z.string().optional(),
  new_establecimiento_comuna: z.string().optional(),
  new_establecimiento_region: z.string().optional(),
  new_establecimiento_telefono: z.string().optional(),
  new_establecimiento_email_contacto: z.string().email("Formato de email inválido.").optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!data.establecimiento_id && !data.new_establecimiento_nombre) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes seleccionar un establecimiento o crear uno nuevo.",
      path: ['establecimiento_id'],
    });
  }
  if (data.new_establecimiento_nombre) {
    if (!data.new_establecimiento_direccion) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La dirección es requerida para un nuevo establecimiento.", path: ['new_establecimiento_direccion'] });
    }
    if (!data.new_establecimiento_comuna) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La comuna es requerida para un nuevo establecimiento.", path: ['new_establecimiento_comuna'] });
    }
    if (!data.new_establecimiento_region) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La región es requerida para un nuevo establecimiento.", path: ['new_establecimiento_region'] });
    }
  }
});

const baseStep3Schema = z.object({
  asignatura_ids: z.array(z.string()).min(0),
  nivel_ids: z.array(z.string()).min(0),
});

export const step3ValidationSchema = step1Schema.merge(baseStep3Schema).superRefine((data, ctx) => {
  if (data.rol_seleccionado === 'docente') {
    if (!data.asignatura_ids || data.asignatura_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar al menos una asignatura.",
        path: ['asignatura_ids'],
      });
    }
    if (!data.nivel_ids || data.nivel_ids.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar al menos un nivel.",
        path: ['nivel_ids'],
      });
    }
  } else if (data.rol_seleccionado === 'coordinador') {
    if (!data.asignatura_ids || !data.asignatura_ids.includes('coordinador_access')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar la opción de coordinador para asignaturas.",
        path: ['asignatura_ids'],
      });
    }
    if (!data.nivel_ids || !data.nivel_ids.includes('coordinador_access')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes seleccionar la opción de coordinador para niveles.",
        path: ['nivel_ids'],
      });
    }
  }
});

export const step3Schema = baseStep3Schema;

export const step4Schema = z.object({}); // No hay campos de formulario para este paso

export type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema> & z.infer<typeof step4Schema>;
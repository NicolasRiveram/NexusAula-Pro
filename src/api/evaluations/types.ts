export interface Evaluation {
  id: string;
  titulo: string;
  tipo: string;
  fecha_aplicacion: string;
  curso_asignaturas: {
    id: string; // This is the curso_asignatura_id
    curso: {
      nombre: string;
      nivel: {
        nombre: string;
      };
    };
    asignatura: {
      nombre: string;
    };
  }[];
}

export interface StudentEvaluation extends Omit<Evaluation, 'curso_asignaturas'> {
  status: 'Pendiente' | 'Completado';
  curso_nombre: string;
  asignatura_nombre: string;
}

export interface EvaluationContentBlock {
  id: string;
  evaluation_id: string;
  block_type: 'text' | 'image';
  content: any;
  orden: number;
  title: string | null;
  visible_en_evaluacion: boolean;
}

export interface ItemAlternative {
  id: string;
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface PIEAdaptation {
  id: string;
  enunciado_adaptado: string;
  alternativas_adaptadas: { texto: string; es_correcta: boolean }[];
}

export interface EvaluationItem {
  id: string;
  enunciado: string;
  tipo_item: 'seleccion_multiple' | 'desarrollo' | 'verdadero_falso';
  puntaje: number;
  orden: number;
  content_block_id: string;
  item_alternativas: ItemAlternative[];
  tiene_adaptacion_pie: boolean;
  adaptaciones_pie: PIEAdaptation[]; // Supabase returns this as an array
}

export interface EvaluationDetail extends Evaluation {
  descripcion: string;
  puntaje_maximo: number | null;
  evaluation_content_blocks: (EvaluationContentBlock & {
    evaluacion_items: EvaluationItem[];
  })[];
}

export interface EvaluationResultSummary {
  student_id: string;
  student_name: string;
  response_id: string | null;
  score: number | null;
  status: 'Completado' | 'Pendiente';
}

export interface EvaluationStatistics {
  total_students: number;
  completed_students: number;
  completion_rate: number;
  average_score: number;
  puntaje_maximo: number;
  score_distribution: { range: string; count: number }[];
}

export interface StudentResponseItem {
  id: string;
  evaluacion_item_id: string;
  alternativa_seleccionada_id: string | null;
  es_correcto: boolean;
  puntaje_item_obtenido: number;
}

export interface StudentResponseHeader {
  student_name: string;
  evaluation_title: string;
}

export interface ItemAnalysisResult {
  item_id: string;
  item_enunciado: string;
  correct_answers_count: number;
  total_answers_count: number;
  correct_percentage: number;
}

export interface StudentAnswer {
  itemId: string;
  selectedAlternativeId: string;
}

export interface CreateEvaluationData {
  titulo: string;
  tipo: string;
  descripcion?: string;
  fecha_aplicacion: string;
  cursoAsignaturaIds: string[];
  randomizar_preguntas?: boolean;
  randomizar_alternativas?: boolean;
}
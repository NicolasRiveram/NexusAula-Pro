-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1.1. Tablas Esenciales

-- Establecimientos
CREATE TABLE IF NOT EXISTS establecimientos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    plan_suscripcion text NOT NULL DEFAULT 'individual' CHECK (plan_suscripcion IN ('individual', 'pro')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Perfiles
CREATE TABLE IF NOT EXISTS perfiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo text NOT NULL,
    rol text NOT NULL CHECK (rol IN ('Docente', 'estudiante', 'coordinador', 'administrador', 'super_administrador')),
    rut text UNIQUE NOT NULL,
    suscripcion_individual_estado boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Perfil Establecimientos (Tabla pivote)
CREATE TABLE IF NOT EXISTS perfil_establecimientos (
    perfil_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    rol_en_establecimiento text NOT NULL CHECK (rol_en_establecimiento IN ('Docente', 'estudiante', 'coordinador', 'administrador')),
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (perfil_id, establecimiento_id)
);

-- 1.2. Tablas Curriculares (Definidas antes de cursos para FKs)

-- Niveles
CREATE TABLE IF NOT EXISTS niveles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Asignaturas
CREATE TABLE IF NOT EXISTS asignaturas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ejes
CREATE TABLE IF NOT EXISTS ejes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Habilidades
CREATE TABLE IF NOT EXISTS habilidades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    descripcion text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Objetivos de Aprendizaje
CREATE TABLE IF NOT EXISTS objetivos_aprendizaje (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_oa text UNIQUE NOT NULL,
    descripcion text NOT NULL,
    eje_id uuid REFERENCES ejes(id) ON DELETE RESTRICT,
    nivel_id uuid REFERENCES niveles(id) ON DELETE RESTRICT,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- OA Habilidades (Tabla de vínculo N-a-N)
CREATE TABLE IF NOT EXISTS oa_habilidades (
    oa_id uuid REFERENCES objetivos_aprendizaje(id) ON DELETE CASCADE,
    habilidad_id uuid REFERENCES habilidades(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (oa_id, habilidad_id)
);

-- Cursos
CREATE TABLE IF NOT EXISTS cursos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    nivel_id uuid REFERENCES niveles(id) ON DELETE RESTRICT,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    docente_creador_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Curso Estudiantes (Vínculo N-a-N)
CREATE TABLE IF NOT EXISTS curso_estudiantes (
    curso_id uuid REFERENCES cursos(id) ON DELETE CASCADE,
    estudiante_perfil_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (curso_id, estudiante_perfil_id)
);

-- Curso Asignaturas (Vínculo clave que define una "clase")
CREATE TABLE IF NOT EXISTS curso_asignaturas (
    curso_id uuid REFERENCES cursos(id) ON DELETE CASCADE,
    docente_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    asignatura_id uuid REFERENCES asignaturas(id) ON DELETE RESTRICT,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (curso_id, docente_id, asignatura_id)
);

-- Horario Curso
CREATE TABLE IF NOT EXISTS horario_curso (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id uuid REFERENCES cursos(id) ON DELETE CASCADE,
    asignatura_id uuid REFERENCES asignaturas(id) ON DELETE RESTRICT,
    dia_semana text NOT NULL CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo')),
    hora_inicio time NOT NULL,
    hora_fin time NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Días No Lectivos
CREATE TABLE IF NOT EXISTS dias_no_lectivos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    fecha date NOT NULL,
    descripcion text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 1.3. Tablas de Módulos de Planificación y Evaluación

-- Unidades
CREATE TABLE IF NOT EXISTS unidades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    curso_id uuid REFERENCES cursos(id) ON DELETE CASCADE,
    asignatura_id uuid REFERENCES asignaturas(id) ON DELETE RESTRICT,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    docente_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    fecha_inicio date,
    fecha_fin date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Proyectos ABP
CREATE TABLE IF NOT EXISTS proyectos_abp (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    descripcion text,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    docente_creador_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    fecha_inicio date,
    fecha_fin date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Proyecto Unidades Link (Vínculo entre unidades y proyectos)
CREATE TABLE IF NOT EXISTS proyecto_unidades_link (
    proyecto_id uuid REFERENCES proyectos_abp(id) ON DELETE CASCADE,
    unidad_id uuid REFERENCES unidades(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (proyecto_id, unidad_id)
);

-- Planificaciones Clase
CREATE TABLE IF NOT EXISTS planificaciones_clase (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    unidad_id uuid REFERENCES unidades(id) ON DELETE CASCADE,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    docente_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    fecha_clase date NOT NULL,
    objetivo_clase text NOT NULL,
    aporte_proyecto text,
    habilidades_desarrollar text[], -- PostgreSQL array type
    secuencia_didactica_inicio text,
    secuencia_didactica_desarrollo text,
    secuencia_didactica_cierre text,
    recursos text[], -- PostgreSQL array type
    vinculo_interdisciplinario text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Evaluaciones
CREATE TABLE IF NOT EXISTS evaluaciones (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre text NOT NULL,
    tipo text CHECK (tipo IN ('formativa', 'sumativa', 'diagnostica')),
    unidad_id uuid REFERENCES unidades(id) ON DELETE SET NULL,
    planificacion_clase_id uuid REFERENCES planificaciones_clase(id) ON DELETE SET NULL,
    proyecto_id uuid REFERENCES proyectos_abp(id) ON DELETE SET NULL,
    establecimiento_id uuid REFERENCES establecimientos(id) ON DELETE CASCADE,
    docente_id uuid REFERENCES perfiles(id) ON DELETE RESTRICT,
    fecha_aplicacion date,
    puntaje_maximo integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Evaluacion Items
CREATE TABLE IF NOT EXISTS evaluacion_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_id uuid REFERENCES evaluaciones(id) ON DELETE CASCADE,
    pregunta text NOT NULL,
    tipo_item text CHECK (tipo_item IN ('multiple_choice', 'desarrollo', 'verdadero_falso')),
    puntaje integer NOT NULL,
    oa_id uuid REFERENCES objetivos_aprendizaje(id) ON DELETE SET NULL,
    habilidad_id uuid REFERENCES habilidades(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Item Alternativas (Para ítems de opción múltiple)
CREATE TABLE IF NOT EXISTS item_alternativas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_item_id uuid REFERENCES evaluacion_items(id) ON DELETE CASCADE,
    texto_alternativa text NOT NULL,
    es_correcta boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Respuestas Estudiante
CREATE TABLE IF NOT EXISTS respuestas_estudiante (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_item_id uuid REFERENCES evaluacion_items(id) ON DELETE CASCADE,
    estudiante_perfil_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
    respuesta_texto text, -- Para respuestas de desarrollo o texto
    alternativa_seleccionada_id uuid REFERENCES item_alternativas(id) ON DELETE SET NULL, -- Para opción múltiple
    puntaje_obtenido integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Desempeño Item Estudiante (Para métricas de desempeño más detalladas)
CREATE TABLE IF NOT EXISTS desempeno_item_estudiante (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluacion_item_id uuid REFERENCES evaluacion_items(id) ON DELETE CASCADE,
    estudiante_perfil_id uuid REFERENCES perfiles(id) ON DELETE CASCADE,
    oa_id uuid REFERENCES objetivos_aprendizaje(id) ON DELETE SET NULL,
    habilidad_id uuid REFERENCES habilidades(id) ON DELETE SET NULL,
    logro_porcentaje numeric(5,2), -- Porcentaje de logro para el ítem (0.00 a 100.00)
    comentario_docente text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Trigger para actualizar 'updated_at' automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('perfil_establecimientos', 'oa_habilidades', 'curso_estudiantes', 'curso_asignaturas', 'proyecto_unidades_link')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS set_timestamp ON %I;
            CREATE TRIGGER set_timestamp
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
        ', t.tablename, t.tablename);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
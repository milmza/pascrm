/*
  # Sistema de Compañías Aseguradoras y Coberturas

  1. Nuevas Tablas
    - `insurance_companies` - Compañías aseguradoras
      - `id` (uuid, clave primaria)
      - `name` (text, nombre de la compañía)
      - `description` (text, descripción)
      - `contact_email` (text, email de contacto)
      - `contact_phone` (text, teléfono de contacto)
      - `website` (text, sitio web)
      - `is_active` (boolean, activa o no)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

    - `coverage_types` - Tipos de cobertura
      - `id` (uuid, clave primaria)
      - `company_id` (uuid, referencia a la compañía)
      - `name` (text, nombre de la cobertura)
      - `description` (text, descripción detallada)
      - `policy_type` (text, tipo de póliza aplicable)
      - `base_premium` (decimal, prima base)
      - `is_active` (boolean, activa o no)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que los agentes solo vean sus propios datos
*/

-- Tabla de compañías aseguradoras
CREATE TABLE IF NOT EXISTS insurance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  contact_email text,
  contact_phone text,
  website text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla de tipos de cobertura
CREATE TABLE IF NOT EXISTS coverage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES insurance_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  policy_type text NOT NULL CHECK (policy_type IN ('vida', 'auto', 'moto', 'bicicleta', 'hogar', 'otro')),
  base_premium decimal(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_types ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para insurance_companies
CREATE POLICY "Agentes pueden ver sus propias compañías"
  ON insurance_companies
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Políticas RLS para coverage_types
CREATE POLICY "Agentes pueden ver sus propios tipos de cobertura"
  ON coverage_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Triggers para updated_at
CREATE TRIGGER update_insurance_companies_updated_at
  BEFORE UPDATE ON insurance_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coverage_types_updated_at
  BEFORE UPDATE ON coverage_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_insurance_companies_agent_id ON insurance_companies(agent_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_active ON insurance_companies(is_active);
CREATE INDEX IF NOT EXISTS idx_coverage_types_agent_id ON coverage_types(agent_id);
CREATE INDEX IF NOT EXISTS idx_coverage_types_company_id ON coverage_types(company_id);
CREATE INDEX IF NOT EXISTS idx_coverage_types_policy_type ON coverage_types(policy_type);
CREATE INDEX IF NOT EXISTS idx_coverage_types_active ON coverage_types(is_active);

-- Agregar columnas a la tabla policies para referenciar las nuevas entidades
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE policies ADD COLUMN company_id uuid REFERENCES insurance_companies(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'coverage_type_id'
  ) THEN
    ALTER TABLE policies ADD COLUMN coverage_type_id uuid REFERENCES coverage_types(id);
  END IF;
END $$;

-- Índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_policies_company_id ON policies(company_id);
CREATE INDEX IF NOT EXISTS idx_policies_coverage_type_id ON policies(coverage_type_id);
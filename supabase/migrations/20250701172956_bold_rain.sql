/*
  # Sistema de Tipos de Pólizas y Monedas

  1. Nuevas Tablas
    - `policy_types` - Tipos de pólizas personalizables
      - `id` (uuid, clave primaria)
      - `name` (text, nombre del tipo)
      - `description` (text, descripción)
      - `icon` (text, emoji o código de icono)
      - `is_active` (boolean, activo o no)
      - `sort_order` (integer, orden de visualización)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

    - `currencies` - Monedas soportadas
      - `id` (uuid, clave primaria)
      - `code` (text, código ISO como USD, EUR, ARS)
      - `name` (text, nombre de la moneda)
      - `symbol` (text, símbolo como $, €, £)
      - `is_active` (boolean, activa o no)
      - `created_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

  2. Modificaciones
    - Agregar `currency_code` a tablas que manejan montos
    - Agregar `policy_type_id` para referenciar tipos personalizados

  3. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que los agentes solo vean sus propios datos
*/

-- Tabla de tipos de pólizas personalizables
CREATE TABLE IF NOT EXISTS policy_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '📋',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(agent_id, name)
);

-- Tabla de monedas
CREATE TABLE IF NOT EXISTS currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(agent_id, code)
);

-- Habilitar RLS
ALTER TABLE policy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para policy_types
CREATE POLICY "Agentes pueden ver sus propios tipos de póliza"
  ON policy_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Políticas RLS para currencies
CREATE POLICY "Agentes pueden ver sus propias monedas"
  ON currencies
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Triggers para updated_at
CREATE TRIGGER update_policy_types_updated_at
  BEFORE UPDATE ON policy_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Agregar columnas a tablas existentes
DO $$
BEGIN
  -- Agregar policy_type_id a policies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'policy_type_id'
  ) THEN
    ALTER TABLE policies ADD COLUMN policy_type_id uuid REFERENCES policy_types(id);
  END IF;
  
  -- Agregar currency_code a policies
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE policies ADD COLUMN currency_code text DEFAULT 'EUR';
  END IF;
  
  -- Agregar currency_code a coverage_types
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coverage_types' AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE coverage_types ADD COLUMN currency_code text DEFAULT 'EUR';
  END IF;
END $$;

-- Función para insertar tipos de póliza por defecto
CREATE OR REPLACE FUNCTION insert_default_policy_types(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO policy_types (agent_id, name, description, icon, sort_order) VALUES
    (user_id, 'Vida', 'Seguros de vida y accidentes personales', '❤️', 1),
    (user_id, 'Auto', 'Seguros para automóviles y vehículos', '🚗', 2),
    (user_id, 'Moto', 'Seguros para motocicletas y ciclomotores', '🏍️', 3),
    (user_id, 'Bicicleta', 'Seguros para bicicletas y e-bikes', '🚲', 4),
    (user_id, 'Hogar', 'Seguros de hogar, contenido y responsabilidad civil', '🏠', 5),
    (user_id, 'Salud', 'Seguros médicos y de salud', '🏥', 6),
    (user_id, 'Viaje', 'Seguros de viaje y asistencia', '✈️', 7),
    (user_id, 'Mascotas', 'Seguros veterinarios para mascotas', '🐕', 8),
    (user_id, 'Responsabilidad Civil', 'Seguros de responsabilidad civil general', '⚖️', 9),
    (user_id, 'Otro', 'Otros tipos de seguros', '📋', 10)
  ON CONFLICT (agent_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Función para insertar monedas por defecto
CREATE OR REPLACE FUNCTION insert_default_currencies(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO currencies (agent_id, code, name, symbol) VALUES
    (user_id, 'EUR', 'Euro', '€'),
    (user_id, 'USD', 'Dólar Estadounidense', '$'),
    (user_id, 'ARS', 'Peso Argentino', '$'),
    (user_id, 'CLP', 'Peso Chileno', '$'),
    (user_id, 'COP', 'Peso Colombiano', '$'),
    (user_id, 'MXN', 'Peso Mexicano', '$'),
    (user_id, 'PEN', 'Sol Peruano', 'S/'),
    (user_id, 'UYU', 'Peso Uruguayo', '$'),
    (user_id, 'BOB', 'Boliviano', 'Bs'),
    (user_id, 'BRL', 'Real Brasileño', 'R$'),
    (user_id, 'GBP', 'Libra Esterlina', '£'),
    (user_id, 'JPY', 'Yen Japonés', '¥'),
    (user_id, 'CAD', 'Dólar Canadiense', 'C$'),
    (user_id, 'CHF', 'Franco Suizo', 'CHF'),
    (user_id, 'CNY', 'Yuan Chino', '¥')
  ON CONFLICT (agent_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para insertar datos por defecto cuando se crea un nuevo usuario
CREATE OR REPLACE FUNCTION setup_default_data_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar tipos de póliza por defecto
  PERFORM insert_default_policy_types(NEW.id);
  
  -- Insertar monedas por defecto
  PERFORM insert_default_currencies(NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para nuevos usuarios (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'setup_user_defaults_trigger'
  ) THEN
    CREATE TRIGGER setup_user_defaults_trigger
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION setup_default_data_for_new_user();
  END IF;
END $$;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_policy_types_agent_id ON policy_types(agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_types_active ON policy_types(is_active);
CREATE INDEX IF NOT EXISTS idx_policy_types_sort_order ON policy_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_currencies_agent_id ON currencies(agent_id);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_policies_policy_type_id ON policies(policy_type_id);
CREATE INDEX IF NOT EXISTS idx_policies_currency_code ON policies(currency_code);
CREATE INDEX IF NOT EXISTS idx_coverage_types_currency_code ON coverage_types(currency_code);
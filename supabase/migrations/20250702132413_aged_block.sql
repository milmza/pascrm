/*
  # Complete CRM Schema for Insurance Agents
  
  This migration creates all necessary tables and relationships for the insurance CRM system.
  
  1. New Tables
    - `policyholders` - Customer information
    - `policies` - Insurance policies
    - `notifications` - System notifications
    - `password_reset_codes` - Password recovery codes
    - `insurance_companies` - Insurance companies
    - `coverage_types` - Coverage types offered by companies
    - `policy_types` - Customizable policy types
    - `currencies` - Supported currencies
    
  2. Security
    - Enable RLS on all tables
    - Policies for agent-specific data access
    
  3. Functions
    - Password reset functionality
    - Default data setup for new users
*/

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS coverage_types CASCADE;
DROP TABLE IF EXISTS insurance_companies CASCADE;
DROP TABLE IF EXISTS policy_types CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS policyholders CASCADE;
DROP TABLE IF EXISTS password_reset_codes CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_policy_notifications() CASCADE;
DROP FUNCTION IF EXISTS generate_reset_code() CASCADE;
DROP FUNCTION IF EXISTS create_password_reset_code(text) CASCADE;
DROP FUNCTION IF EXISTS verify_reset_code(text, text) CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_reset_codes() CASCADE;
DROP FUNCTION IF EXISTS insert_default_policy_types(uuid) CASCADE;
DROP FUNCTION IF EXISTS insert_default_currencies(uuid) CASCADE;
DROP FUNCTION IF EXISTS setup_default_data_for_new_user() CASCADE;

-- Create function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: currencies
CREATE TABLE currencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(agent_id, code)
);

-- Table: policy_types
CREATE TABLE policy_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text DEFAULT '📋',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  custom_fields jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(agent_id, name)
);

-- Table: insurance_companies
CREATE TABLE insurance_companies (
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

-- Table: coverage_types
CREATE TABLE coverage_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES insurance_companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  policy_type text NOT NULL CHECK (policy_type IN ('vida', 'auto', 'moto', 'bicicleta', 'hogar', 'salud', 'viaje', 'mascotas', 'responsabilidad civil', 'otro')),
  base_premium decimal(10,2) DEFAULT 0,
  currency_code text DEFAULT 'EUR',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: policyholders
CREATE TABLE policyholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE,
  phone text,
  address text,
  city text,
  state text,
  postal_code text,
  date_of_birth date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: policies
CREATE TABLE policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number text UNIQUE NOT NULL,
  policyholder_id uuid REFERENCES policyholders(id) ON DELETE CASCADE,
  policy_type text NOT NULL CHECK (policy_type IN ('vida', 'auto', 'moto', 'bicicleta', 'hogar', 'salud', 'viaje', 'mascotas', 'responsabilidad civil', 'otro')),
  policy_type_id uuid REFERENCES policy_types(id),
  company_id uuid REFERENCES insurance_companies(id),
  coverage_type_id uuid REFERENCES coverage_types(id),
  insurance_company text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  premium_amount decimal(10,2) NOT NULL,
  currency_code text DEFAULT 'EUR',
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('mensual', 'trimestral', 'semestral', 'anual')),
  coverage_details jsonb DEFAULT '{}',
  custom_data jsonb DEFAULT '{}',
  status text DEFAULT 'activa' CHECK (status IN ('activa', 'vencida', 'cancelada', 'pendiente')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('vencimiento', 'pago_pendiente', 'renovacion')),
  notification_date date NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table: password_reset_codes
CREATE TABLE password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE coverage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE policyholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agentes pueden ver sus propias monedas"
  ON currencies FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propios tipos de póliza"
  ON policy_types FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propias compañías"
  ON insurance_companies FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propios tipos de cobertura"
  ON coverage_types FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propios asegurados"
  ON policyholders FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propias pólizas"
  ON policies FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Agentes pueden ver sus propias notificaciones"
  ON notifications FOR ALL TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Sistema puede acceder a códigos de reset"
  ON password_reset_codes FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- Triggers for updated_at
CREATE TRIGGER update_policy_types_updated_at
  BEFORE UPDATE ON policy_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_companies_updated_at
  BEFORE UPDATE ON insurance_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coverage_types_updated_at
  BEFORE UPDATE ON coverage_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policyholders_updated_at
  BEFORE UPDATE ON policyholders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Password reset functions
CREATE OR REPLACE FUNCTION generate_reset_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_password_reset_code(user_email text)
RETURNS text AS $$
DECLARE
  reset_code text;
BEGIN
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email es requerido';
  END IF;
  
  reset_code := generate_reset_code();
  
  UPDATE password_reset_codes 
  SET used = true 
  WHERE email = user_email AND used = false;
  
  INSERT INTO password_reset_codes (email, code, expires_at)
  VALUES (
    user_email,
    reset_code,
    now() + INTERVAL '15 minutes'
  );
  
  RETURN reset_code;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear código de recuperación: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_reset_code(user_email text, verification_code text)
RETURNS boolean AS $$
DECLARE
  code_valid boolean := false;
BEGIN
  IF user_email IS NULL OR user_email = '' OR verification_code IS NULL OR verification_code = '' THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS(
    SELECT 1 FROM password_reset_codes
    WHERE email = user_email
    AND code = verification_code
    AND expires_at > now()
    AND used = false
  ) INTO code_valid;
  
  IF code_valid THEN
    UPDATE password_reset_codes
    SET used = true
    WHERE email = user_email 
    AND code = verification_code 
    AND used = false;
  END IF;
  
  RETURN code_valid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notification generation function
CREATE OR REPLACE FUNCTION generate_policy_notifications()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (policy_id, notification_type, notification_date, message, agent_id)
  VALUES (
    NEW.id,
    'vencimiento',
    NEW.end_date - INTERVAL '30 days',
    'La póliza ' || NEW.policy_number || ' vence en 30 días',
    NEW.agent_id
  );
  
  INSERT INTO notifications (policy_id, notification_type, notification_date, message, agent_id)
  VALUES (
    NEW.id,
    'renovacion',
    NEW.end_date - INTERVAL '60 days',
    'Considere renovar la póliza ' || NEW.policy_number,
    NEW.agent_id
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_notifications_on_policy_insert
  AFTER INSERT ON policies
  FOR EACH ROW EXECUTE FUNCTION generate_policy_notifications();

-- Default data functions
CREATE OR REPLACE FUNCTION insert_default_policy_types(user_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO policy_types (agent_id, name, description, icon, sort_order, custom_fields) VALUES
    (user_id, 'Vida', 'Seguros de vida y accidentes personales', '❤️', 1, '[
      {"id": "suma_asegurada", "name": "suma_asegurada", "label": "Suma Asegurada", "type": "number", "required": true, "placeholder": "Monto de cobertura"},
      {"id": "beneficiarios", "name": "beneficiarios", "label": "Beneficiarios", "type": "textarea", "required": false, "placeholder": "Lista de beneficiarios"},
      {"id": "ocupacion", "name": "ocupacion", "label": "Ocupación del Asegurado", "type": "text", "required": false, "placeholder": "Profesión u ocupación"}
    ]'),
    (user_id, 'Auto', 'Seguros para automóviles y vehículos', '🚗', 2, '[
      {"id": "marca", "name": "marca", "label": "Marca", "type": "text", "required": true, "placeholder": "Marca del vehículo"},
      {"id": "modelo", "name": "modelo", "label": "Modelo", "type": "text", "required": true, "placeholder": "Modelo del vehículo"},
      {"id": "año", "name": "año", "label": "Año", "type": "number", "required": true, "placeholder": "Año de fabricación"},
      {"id": "patente", "name": "patente", "label": "Patente/Matrícula", "type": "text", "required": true, "placeholder": "Número de patente"},
      {"id": "valor_vehiculo", "name": "valor_vehiculo", "label": "Valor del Vehículo", "type": "number", "required": false, "placeholder": "Valor comercial"},
      {"id": "uso", "name": "uso", "label": "Uso del Vehículo", "type": "select", "required": false, "options": ["Particular", "Comercial", "Taxi/Remis", "Carga"]}
    ]'),
    (user_id, 'Moto', 'Seguros para motocicletas y ciclomotores', '🏍️', 3, '[
      {"id": "marca", "name": "marca", "label": "Marca", "type": "text", "required": true, "placeholder": "Marca de la motocicleta"},
      {"id": "modelo", "name": "modelo", "label": "Modelo", "type": "text", "required": true, "placeholder": "Modelo de la motocicleta"},
      {"id": "año", "name": "año", "label": "Año", "type": "number", "required": true, "placeholder": "Año de fabricación"},
      {"id": "patente", "name": "patente", "label": "Patente/Matrícula", "type": "text", "required": true, "placeholder": "Número de patente"},
      {"id": "cilindrada", "name": "cilindrada", "label": "Cilindrada (cc)", "type": "number", "required": false, "placeholder": "Cilindrada en cc"}
    ]'),
    (user_id, 'Bicicleta', 'Seguros para bicicletas y e-bikes', '🚲', 4, '[
      {"id": "marca", "name": "marca", "label": "Marca", "type": "text", "required": true, "placeholder": "Marca de la bicicleta"},
      {"id": "modelo", "name": "modelo", "label": "Modelo", "type": "text", "required": true, "placeholder": "Modelo de la bicicleta"},
      {"id": "tipo", "name": "tipo", "label": "Tipo", "type": "select", "required": true, "options": ["Urbana", "Montaña", "Ruta", "Eléctrica", "Plegable"]},
      {"id": "valor", "name": "valor", "label": "Valor de la Bicicleta", "type": "number", "required": false, "placeholder": "Valor comercial"},
      {"id": "numero_serie", "name": "numero_serie", "label": "Número de Serie", "type": "text", "required": false, "placeholder": "Número de serie o identificación"}
    ]'),
    (user_id, 'Hogar', 'Seguros de hogar, contenido y responsabilidad civil', '🏠', 5, '[
      {"id": "direccion", "name": "direccion", "label": "Dirección de la Propiedad", "type": "textarea", "required": true, "placeholder": "Dirección completa del inmueble"},
      {"id": "tipo_vivienda", "name": "tipo_vivienda", "label": "Tipo de Vivienda", "type": "select", "required": true, "options": ["Casa", "Departamento", "PH", "Quinta", "Local Comercial"]},
      {"id": "superficie", "name": "superficie", "label": "Superficie (m²)", "type": "number", "required": false, "placeholder": "Superficie en metros cuadrados"},
      {"id": "valor_contenido", "name": "valor_contenido", "label": "Valor del Contenido", "type": "number", "required": false, "placeholder": "Valor estimado del contenido"},
      {"id": "alarma", "name": "alarma", "label": "Sistema de Alarma", "type": "select", "required": false, "options": ["Sí", "No"]}
    ]'),
    (user_id, 'Salud', 'Seguros médicos y de salud', '🏥', 6, '[
      {"id": "plan", "name": "plan", "label": "Plan de Salud", "type": "text", "required": false, "placeholder": "Nombre del plan"},
      {"id": "cobertura_geografica", "name": "cobertura_geografica", "label": "Cobertura Geográfica", "type": "select", "required": false, "options": ["Nacional", "Internacional", "Regional"]},
      {"id": "deducible", "name": "deducible", "label": "Deducible", "type": "number", "required": false, "placeholder": "Monto del deducible"},
      {"id": "preexistencias", "name": "preexistencias", "label": "Enfermedades Preexistentes", "type": "textarea", "required": false, "placeholder": "Detalle de condiciones preexistentes"}
    ]'),
    (user_id, 'Viaje', 'Seguros de viaje y asistencia', '✈️', 7, '[
      {"id": "destino", "name": "destino", "label": "Destino", "type": "text", "required": true, "placeholder": "País o región de destino"},
      {"id": "fecha_inicio", "name": "fecha_inicio", "label": "Fecha de Inicio", "type": "date", "required": true},
      {"id": "fecha_fin", "name": "fecha_fin", "label": "Fecha de Fin", "type": "date", "required": true},
      {"id": "motivo_viaje", "name": "motivo_viaje", "label": "Motivo del Viaje", "type": "select", "required": false, "options": ["Turismo", "Negocios", "Estudio", "Trabajo", "Otro"]},
      {"id": "cobertura_medica", "name": "cobertura_medica", "label": "Cobertura Médica", "type": "number", "required": false, "placeholder": "Monto de cobertura médica"}
    ]'),
    (user_id, 'Mascotas', 'Seguros veterinarios para mascotas', '🐕', 8, '[
      {"id": "nombre_mascota", "name": "nombre_mascota", "label": "Nombre de la Mascota", "type": "text", "required": true, "placeholder": "Nombre de la mascota"},
      {"id": "especie", "name": "especie", "label": "Especie", "type": "select", "required": true, "options": ["Perro", "Gato", "Ave", "Otro"]},
      {"id": "raza", "name": "raza", "label": "Raza", "type": "text", "required": false, "placeholder": "Raza de la mascota"},
      {"id": "edad", "name": "edad", "label": "Edad", "type": "number", "required": false, "placeholder": "Edad en años"},
      {"id": "peso", "name": "peso", "label": "Peso (kg)", "type": "number", "required": false, "placeholder": "Peso en kilogramos"}
    ]'),
    (user_id, 'Responsabilidad Civil', 'Seguros de responsabilidad civil general', '⚖️', 9, '[
      {"id": "actividad", "name": "actividad", "label": "Actividad/Profesión", "type": "text", "required": true, "placeholder": "Actividad o profesión cubierta"},
      {"id": "limite_cobertura", "name": "limite_cobertura", "label": "Límite de Cobertura", "type": "number", "required": false, "placeholder": "Límite máximo de cobertura"},
      {"id": "territorio", "name": "territorio", "label": "Territorio de Cobertura", "type": "text", "required": false, "placeholder": "Ámbito geográfico de cobertura"}
    ]'),
    (user_id, 'Otro', 'Otros tipos de seguros', '📋', 10, '[
      {"id": "descripcion", "name": "descripcion", "label": "Descripción del Seguro", "type": "textarea", "required": true, "placeholder": "Descripción detallada del tipo de seguro"},
      {"id": "bien_asegurado", "name": "bien_asegurado", "label": "Bien Asegurado", "type": "text", "required": false, "placeholder": "Descripción del bien o servicio asegurado"}
    ]')
  ON CONFLICT (agent_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_currencies_agent_id ON currencies(agent_id);
CREATE INDEX IF NOT EXISTS idx_currencies_active ON currencies(is_active);
CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);

CREATE INDEX IF NOT EXISTS idx_policy_types_agent_id ON policy_types(agent_id);
CREATE INDEX IF NOT EXISTS idx_policy_types_active ON policy_types(is_active);
CREATE INDEX IF NOT EXISTS idx_policy_types_sort_order ON policy_types(sort_order);

CREATE INDEX IF NOT EXISTS idx_insurance_companies_agent_id ON insurance_companies(agent_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_active ON insurance_companies(is_active);

CREATE INDEX IF NOT EXISTS idx_coverage_types_agent_id ON coverage_types(agent_id);
CREATE INDEX IF NOT EXISTS idx_coverage_types_company_id ON coverage_types(company_id);
CREATE INDEX IF NOT EXISTS idx_coverage_types_policy_type ON coverage_types(policy_type);
CREATE INDEX IF NOT EXISTS idx_coverage_types_active ON coverage_types(is_active);
CREATE INDEX IF NOT EXISTS idx_coverage_types_currency_code ON coverage_types(currency_code);

CREATE INDEX IF NOT EXISTS idx_policyholders_agent_id ON policyholders(agent_id);

CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON policies(end_date);
CREATE INDEX IF NOT EXISTS idx_policies_company_id ON policies(company_id);
CREATE INDEX IF NOT EXISTS idx_policies_coverage_type_id ON policies(coverage_type_id);
CREATE INDEX IF NOT EXISTS idx_policies_policy_type_id ON policies(policy_type_id);
CREATE INDEX IF NOT EXISTS idx_policies_currency_code ON policies(currency_code);

CREATE INDEX IF NOT EXISTS idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_password_reset_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_reset_code(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reset_codes() TO authenticated;
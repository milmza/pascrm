/*
  # Esquema CRM para Agentes de Seguros

  1. Nuevas Tablas
    - `policyholders` - Información de asegurados
      - `id` (uuid, clave primaria)
      - `first_name` (text, nombre)
      - `last_name` (text, apellido)
      - `email` (text, email único)
      - `phone` (text, teléfono)
      - `address` (text, dirección)
      - `city` (text, ciudad)
      - `state` (text, estado/provincia)
      - `postal_code` (text, código postal)
      - `date_of_birth` (date, fecha de nacimiento)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

    - `policies` - Pólizas de seguros
      - `id` (uuid, clave primaria)
      - `policy_number` (text, número de póliza único)
      - `policyholder_id` (uuid, referencia al asegurado)
      - `policy_type` (text, tipo de seguro)
      - `insurance_company` (text, compañía aseguradora)
      - `start_date` (date, fecha de inicio)
      - `end_date` (date, fecha de vencimiento)
      - `premium_amount` (decimal, monto de prima)
      - `payment_frequency` (text, frecuencia de pago)
      - `coverage_details` (jsonb, detalles de cobertura)
      - `status` (text, estado de la póliza)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

    - `notifications` - Sistema de notificaciones
      - `id` (uuid, clave primaria)
      - `policy_id` (uuid, referencia a la póliza)
      - `notification_type` (text, tipo de notificación)
      - `notification_date` (date, fecha de notificación)
      - `message` (text, mensaje)
      - `is_read` (boolean, leída o no)
      - `created_at` (timestamp)
      - `agent_id` (uuid, referencia al agente)

  2. Seguridad
    - Habilitar RLS en todas las tablas
    - Políticas para que los agentes solo vean sus propios datos
*/

-- Tabla de asegurados
CREATE TABLE IF NOT EXISTS policyholders (
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

-- Tabla de pólizas
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_number text UNIQUE NOT NULL,
  policyholder_id uuid REFERENCES policyholders(id) ON DELETE CASCADE,
  policy_type text NOT NULL CHECK (policy_type IN ('vida', 'auto', 'moto', 'bicicleta', 'hogar', 'otro')),
  insurance_company text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  premium_amount decimal(10,2) NOT NULL,
  payment_frequency text NOT NULL CHECK (payment_frequency IN ('mensual', 'trimestral', 'semestral', 'anual')),
  coverage_details jsonb DEFAULT '{}',
  status text DEFAULT 'activa' CHECK (status IN ('activa', 'vencida', 'cancelada', 'pendiente')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('vencimiento', 'pago_pendiente', 'renovacion')),
  notification_date date NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS
ALTER TABLE policyholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para policyholders
CREATE POLICY "Agentes pueden ver sus propios asegurados"
  ON policyholders
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Políticas RLS para policies  
CREATE POLICY "Agentes pueden ver sus propias pólizas"
  ON policies
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Políticas RLS para notifications
CREATE POLICY "Agentes pueden ver sus propias notificaciones"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = agent_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_policyholders_updated_at
  BEFORE UPDATE ON policyholders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para generar notificaciones automáticas
CREATE OR REPLACE FUNCTION generate_policy_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificación de vencimiento (30 días antes)
  INSERT INTO notifications (policy_id, notification_type, notification_date, message, agent_id)
  VALUES (
    NEW.id,
    'vencimiento',
    NEW.end_date - INTERVAL '30 days',
    'La póliza ' || NEW.policy_number || ' vence en 30 días',
    NEW.agent_id
  );
  
  -- Notificación de renovación (60 días antes)
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

-- Trigger para generar notificaciones automáticamente
CREATE TRIGGER generate_notifications_on_policy_insert
  AFTER INSERT ON policies
  FOR EACH ROW EXECUTE FUNCTION generate_policy_notifications();

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_policyholders_agent_id ON policyholders(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_agent_id ON policies(agent_id);
CREATE INDEX IF NOT EXISTS idx_policies_end_date ON policies(end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_agent_id ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_date ON notifications(notification_date);
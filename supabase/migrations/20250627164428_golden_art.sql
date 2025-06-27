/*
  # Sistema de códigos de recuperación de contraseña

  1. Nueva Tabla
    - `password_reset_codes` - Códigos de verificación para recuperación
      - `id` (uuid, clave primaria)
      - `email` (text, email del usuario)
      - `code` (text, código de 6 dígitos)
      - `expires_at` (timestamp, expiración del código)
      - `used` (boolean, si ya fue usado)
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla
    - Los códigos expiran en 15 minutos
    - Solo se puede usar una vez
*/

-- Tabla para códigos de recuperación de contraseña
CREATE TABLE IF NOT EXISTS password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Política RLS - solo el sistema puede acceder
CREATE POLICY "Solo acceso del sistema a códigos de reset"
  ON password_reset_codes
  FOR ALL
  TO authenticated
  USING (false);

-- Función para generar código de 6 dígitos
CREATE OR REPLACE FUNCTION generate_reset_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Función para crear código de recuperación
CREATE OR REPLACE FUNCTION create_password_reset_code(user_email text)
RETURNS text AS $$
DECLARE
  reset_code text;
BEGIN
  -- Generar código de 6 dígitos
  reset_code := generate_reset_code();
  
  -- Invalidar códigos anteriores para este email
  UPDATE password_reset_codes 
  SET used = true 
  WHERE email = user_email AND used = false;
  
  -- Crear nuevo código
  INSERT INTO password_reset_codes (email, code, expires_at)
  VALUES (
    user_email,
    reset_code,
    now() + INTERVAL '15 minutes'
  );
  
  RETURN reset_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar código de recuperación
CREATE OR REPLACE FUNCTION verify_reset_code(user_email text, verification_code text)
RETURNS boolean AS $$
DECLARE
  code_valid boolean := false;
BEGIN
  -- Verificar si el código es válido
  SELECT EXISTS(
    SELECT 1 FROM password_reset_codes
    WHERE email = user_email
    AND code = verification_code
    AND expires_at > now()
    AND used = false
  ) INTO code_valid;
  
  -- Si es válido, marcarlo como usado
  IF code_valid THEN
    UPDATE password_reset_codes
    SET used = true
    WHERE email = user_email AND code = verification_code;
  END IF;
  
  RETURN code_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);

-- Función para limpiar códigos expirados (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;
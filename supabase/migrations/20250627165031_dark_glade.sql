/*
  # Corregir funciones de recuperación de contraseña

  1. Funciones corregidas
    - `generate_reset_code()` - Genera códigos de 6 dígitos
    - `create_password_reset_code()` - Crea y almacena códigos
    - `verify_reset_code()` - Verifica validez y marca como usado
    - `cleanup_expired_reset_codes()` - Limpia códigos expirados

  2. Seguridad
    - Funciones con SECURITY DEFINER para acceso controlado
    - RLS habilitado en la tabla
    - Políticas restrictivas
*/

-- Recrear tabla si no existe
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

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Solo acceso del sistema a códigos de reset" ON password_reset_codes;

-- Política RLS - solo funciones del sistema pueden acceder
CREATE POLICY "Sistema puede acceder a códigos de reset"
  ON password_reset_codes
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Función para generar código de 6 dígitos
CREATE OR REPLACE FUNCTION generate_reset_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear código de recuperación
CREATE OR REPLACE FUNCTION create_password_reset_code(user_email text)
RETURNS text AS $$
DECLARE
  reset_code text;
BEGIN
  -- Verificar que el email no esté vacío
  IF user_email IS NULL OR user_email = '' THEN
    RAISE EXCEPTION 'Email es requerido';
  END IF;
  
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error al crear código de recuperación: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar código de recuperación
CREATE OR REPLACE FUNCTION verify_reset_code(user_email text, verification_code text)
RETURNS boolean AS $$
DECLARE
  code_valid boolean := false;
BEGIN
  -- Verificar parámetros
  IF user_email IS NULL OR user_email = '' OR verification_code IS NULL OR verification_code = '' THEN
    RETURN false;
  END IF;
  
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

-- Función para limpiar códigos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_reset_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_codes
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON password_reset_codes(code);

-- Conceder permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_password_reset_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_reset_code(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reset_codes() TO authenticated;
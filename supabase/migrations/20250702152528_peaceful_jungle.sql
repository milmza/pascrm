/*
  # Adaptar sistema para personas físicas y jurídicas

  1. Modificaciones a la tabla policyholders
    - Agregar `entity_type` (físico/jurídico)
    - Agregar `dni` para personas físicas
    - Agregar `cuil_cuit` para personas físicas y jurídicas
    - Agregar `business_name` para personas jurídicas
    - Agregar `legal_representative` para personas jurídicas
    - Modificar campos existentes para ser opcionales según el tipo

  2. Seguridad
    - Mantener RLS existente
    - Agregar validaciones para campos requeridos según tipo de entidad
*/

-- Agregar nuevas columnas a la tabla policyholders
DO $$
BEGIN
  -- Agregar entity_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'entity_type'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN entity_type text DEFAULT 'fisico' CHECK (entity_type IN ('fisico', 'juridico'));
  END IF;
  
  -- Agregar DNI
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'dni'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN dni text;
  END IF;
  
  -- Agregar CUIL/CUIT
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'cuil_cuit'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN cuil_cuit text;
  END IF;
  
  -- Agregar business_name para personas jurídicas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'business_name'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN business_name text;
  END IF;
  
  -- Agregar legal_representative para personas jurídicas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'legal_representative'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN legal_representative text;
  END IF;
  
  -- Agregar business_type para clasificar el tipo de entidad jurídica
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policyholders' AND column_name = 'business_type'
  ) THEN
    ALTER TABLE policyholders ADD COLUMN business_type text;
  END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_policyholders_entity_type ON policyholders(entity_type);
CREATE INDEX IF NOT EXISTS idx_policyholders_dni ON policyholders(dni);
CREATE INDEX IF NOT EXISTS idx_policyholders_cuil_cuit ON policyholders(cuil_cuit);

-- Función de validación para asegurar que los campos requeridos estén presentes según el tipo de entidad
CREATE OR REPLACE FUNCTION validate_policyholder_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validaciones para personas físicas
  IF NEW.entity_type = 'fisico' THEN
    IF NEW.first_name IS NULL OR NEW.first_name = '' THEN
      RAISE EXCEPTION 'El nombre es requerido para personas físicas';
    END IF;
    IF NEW.last_name IS NULL OR NEW.last_name = '' THEN
      RAISE EXCEPTION 'El apellido es requerido para personas físicas';
    END IF;
  END IF;
  
  -- Validaciones para personas jurídicas
  IF NEW.entity_type = 'juridico' THEN
    IF NEW.business_name IS NULL OR NEW.business_name = '' THEN
      RAISE EXCEPTION 'La razón social es requerida para personas jurídicas';
    END IF;
    IF NEW.cuil_cuit IS NULL OR NEW.cuil_cuit = '' THEN
      RAISE EXCEPTION 'El CUIT es requerido para personas jurídicas';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para validación
DROP TRIGGER IF EXISTS validate_policyholder_trigger ON policyholders;
CREATE TRIGGER validate_policyholder_trigger
  BEFORE INSERT OR UPDATE ON policyholders
  FOR EACH ROW EXECUTE FUNCTION validate_policyholder_data();

-- Actualizar registros existentes para que tengan entity_type = 'fisico'
UPDATE policyholders SET entity_type = 'fisico' WHERE entity_type IS NULL;
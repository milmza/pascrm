/*
  # Fix policyholder constraints and validation

  1. Changes
    - Remove unique constraint from email field (allow multiple policyholders with same email or no email)
    - Add unique constraints for DNI and CUIL/CUIT when not null
    - Ensure data integrity for identification numbers

  2. Security
    - Maintain RLS policies
    - Add partial unique indexes for better performance
*/

-- Remove unique constraint from email
ALTER TABLE policyholders DROP CONSTRAINT IF EXISTS policyholders_email_key;

-- Add unique constraints for DNI and CUIL/CUIT (only when not null)
-- This allows multiple null values but ensures uniqueness when values are provided
CREATE UNIQUE INDEX IF NOT EXISTS idx_policyholders_dni_unique 
  ON policyholders(agent_id, dni) 
  WHERE dni IS NOT NULL AND dni != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_policyholders_cuil_cuit_unique 
  ON policyholders(agent_id, cuil_cuit) 
  WHERE cuil_cuit IS NOT NULL AND cuil_cuit != '';

-- Add check constraints to ensure DNI and CUIL/CUIT contain only numbers
ALTER TABLE policyholders 
  ADD CONSTRAINT check_dni_numeric 
  CHECK (dni IS NULL OR dni = '' OR dni ~ '^[0-9]+$');

ALTER TABLE policyholders 
  ADD CONSTRAINT check_cuil_cuit_numeric 
  CHECK (cuil_cuit IS NULL OR cuil_cuit = '' OR cuil_cuit ~ '^[0-9]+$');
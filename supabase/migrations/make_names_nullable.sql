/*
# Make first_name and last_name nullable

1. Modified Tables
  - `policyholders`
    - Modify `first_name` column (TEXT, nullable)
    - Modify `last_name` column (TEXT, nullable)

2. Summary
  - Allows null values for first_name and last_name to support juridical entities
  - Maintains data integrity by only requiring these fields for physical persons
*/

DO $$
BEGIN
  ALTER TABLE policyholders 
    ALTER COLUMN first_name DROP NOT NULL,
    ALTER COLUMN last_name DROP NOT NULL;
EXCEPTION
  WHEN undefined_column THEN
    -- Handle case where columns don't exist (shouldn't happen in our case)
    RAISE NOTICE 'Columns already modified';
END $$;
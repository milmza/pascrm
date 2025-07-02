/*
      # Add entity_type column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `entity_type` column (TEXT, not nullable, default 'fisico')

      2. Summary
        - This migration adds the `entity_type` column to the `policyholders` table.
        - This column is used to store the type of entity (fisico or juridico) of policyholders.
        - A default value of 'fisico' is set for existing rows.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'fisico';
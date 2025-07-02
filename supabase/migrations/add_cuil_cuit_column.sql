/*
      # Add cuil_cuit column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `cuil_cuit` column (text, nullable)

      2. Summary
        - This migration adds the `cuil_cuit` column to the `policyholders` table.
        - This column is used to store the CUIL/CUIT of policyholders.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS cuil_cuit TEXT;

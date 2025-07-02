/*
      # Add dni column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `dni` column (text, nullable)

      2. Summary
        - This migration adds the `dni` column to the `policyholders` table.
        - This column is used to store the DNI of policyholders.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS dni TEXT;
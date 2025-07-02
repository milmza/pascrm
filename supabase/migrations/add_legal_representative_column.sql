/*
      # Add legal_representative column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `legal_representative` column (TEXT, nullable)

      2. Summary
        - This migration adds the `legal_representative` column to the `policyholders` table.
        - This column is used to store the legal representative of juridical policyholders.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS legal_representative TEXT;

/*
      # Add business_name column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `business_name` column (text, nullable)

      2. Summary
        - This migration adds the `business_name` column to the `policyholders` table.
        - This column is used to store the business name of juridical policyholders.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS business_name TEXT;
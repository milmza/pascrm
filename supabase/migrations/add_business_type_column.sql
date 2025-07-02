/*
      # Add business_type column to policyholders table

      1. Modified Tables
        - `policyholders`
          - Added `business_type` column (text, nullable)

      2. Summary
        - This migration adds the `business_type` column to the `policyholders` table.
        - This column is used to store the business type of juridical policyholders.
    */

    ALTER TABLE IF EXISTS policyholders
    ADD COLUMN IF NOT EXISTS business_type TEXT;
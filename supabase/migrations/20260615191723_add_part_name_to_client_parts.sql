-- Add part_name column to client_parts table for free text input
-- This allows users to type the part name instead of selecting from a dropdown

ALTER TABLE client_parts 
ADD COLUMN IF NOT EXISTS part_name TEXT;

-- Make part_id nullable since we'll use part_name instead
ALTER TABLE client_parts 
ALTER COLUMN part_id DROP NOT NULL;

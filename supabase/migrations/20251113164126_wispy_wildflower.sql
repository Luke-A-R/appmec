/*
  # Add damage_checklist column to vehicles table

  1. Changes
    - Add `damage_checklist` column to `vehicles` table
    - Column type: JSONB for storing structured damage data
    - Default value: empty object
    - Allow null values for existing records

  2. Structure
    The damage_checklist will store:
    - scratches: boolean
    - dents: boolean  
    - rust: boolean
    - paint_damage: boolean
    - broken_parts: boolean
    - interior_damage: boolean
    - tire_condition: boolean
    - other_issues: boolean
    - notes: string
*/

-- Add damage_checklist column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS damage_checklist JSONB DEFAULT '{}'::jsonb;

-- Add comment to document the column purpose
COMMENT ON COLUMN vehicles.damage_checklist IS 'JSON object storing vehicle damage assessment checklist';
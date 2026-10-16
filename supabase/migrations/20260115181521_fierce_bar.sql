/*
  # Add days_worked column to project_steps table

  1. Changes
    - Add `days_worked` column to `project_steps` table
    - Set default value to 0
    - Allow null values for backward compatibility

  2. Notes
    - This column will store the number of days worked on each project step
    - Used for reporting and progress tracking
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'project_steps' AND column_name = 'days_worked'
  ) THEN
    ALTER TABLE project_steps ADD COLUMN days_worked numeric(5,2) DEFAULT 0;
  END IF;
END $$;
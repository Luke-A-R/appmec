/*
  # Add image columns to projects table

  1. Changes
    - Add `before_images` column to `projects` table (text array, default empty array)
    - Add `after_images` column to `projects` table (text array, default empty array)
  
  2. Notes
    - These columns will store URLs of images taken before and after project completion
    - Default value is empty array to ensure compatibility with existing records
    - Columns are nullable to allow projects without images
*/

-- Add before_images column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'before_images'
  ) THEN
    ALTER TABLE projects ADD COLUMN before_images text[] DEFAULT '{}';
  END IF;
END $$;

-- Add after_images column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'after_images'
  ) THEN
    ALTER TABLE projects ADD COLUMN after_images text[] DEFAULT '{}';
  END IF;
END $$;
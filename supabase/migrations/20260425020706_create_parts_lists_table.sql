/*
  # Create parts_lists table

  1. New Tables
    - `parts_lists`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `vehicle_id` (uuid, foreign key to vehicles)
      - `parts` (text array, list of part names)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `parts_lists` table
    - Add policy for authenticated users to manage parts lists
*/

CREATE TABLE IF NOT EXISTS parts_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  parts text[] NOT NULL DEFAULT '{}',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE parts_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage parts lists"
  ON parts_lists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

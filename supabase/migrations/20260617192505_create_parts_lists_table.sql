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

CREATE POLICY "select_parts_lists" ON parts_lists FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_parts_lists" ON parts_lists FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_parts_lists" ON parts_lists FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_parts_lists" ON parts_lists FOR DELETE
  TO authenticated USING (true);

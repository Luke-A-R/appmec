/*
  # Sistema de Gestão Automotiva - Schema Completo

  1. Tabelas Principais
    - `clients` - Dados dos clientes
    - `vehicles` - Veículos dos clientes
    - `projects` - Projetos de serviços
    - `project_steps` - Etapas dos projetos
    - `parts` - Catálogo de peças
    - `client_parts` - Peças dos clientes
    - `project_parts` - Peças utilizadas nos projetos
    - `schedules` - Agendamentos

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para operações CRUD

  3. Funcionalidades
    - Triggers para atualização automática
    - Funções para cálculos
*/

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  color text DEFAULT '',
  license_plate text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  service_type text NOT NULL,
  status text DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed', 'on-hold', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date date,
  estimated_completion date,
  actual_completion date,
  estimated_cost decimal(10,2) DEFAULT 0,
  actual_cost decimal(10,2) DEFAULT 0,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes text DEFAULT '',
  client_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Etapas dos Projetos
CREATE TABLE IF NOT EXISTS project_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  step_order integer NOT NULL,
  completed boolean DEFAULT false,
  start_date date,
  completed_date date,
  estimated_hours decimal(5,2) DEFAULT 0,
  actual_hours decimal(5,2) DEFAULT 0,
  responsible text NOT NULL,
  notes text DEFAULT '',
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Peças (Catálogo)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  part_number text UNIQUE NOT NULL,
  description text DEFAULT '',
  current_stock integer DEFAULT 0 CHECK (current_stock >= 0),
  min_stock integer DEFAULT 0 CHECK (min_stock >= 0),
  max_stock integer DEFAULT 100 CHECK (max_stock >= min_stock),
  unit_price decimal(10,2) DEFAULT 0 CHECK (unit_price >= 0),
  supplier text DEFAULT '',
  location text DEFAULT '',
  status text DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Peças dos Clientes
CREATE TABLE IF NOT EXISTS client_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  condition text DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished', 'damaged')),
  notes text DEFAULT '',
  received_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Peças utilizadas nos Projetos
CREATE TABLE IF NOT EXISTS project_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  quantity_used integer NOT NULL CHECK (quantity_used > 0),
  unit_cost decimal(10,2) DEFAULT 0,
  total_cost decimal(10,2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
  notes text DEFAULT '',
  used_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  title text NOT NULL,
  service text NOT NULL,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  duration_hours decimal(3,1) DEFAULT 1.0,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (permitir todas as operações para usuários autenticados)
CREATE POLICY "Allow all operations for authenticated users" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON vehicles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON projects
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON project_steps
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON client_parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON project_parts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON schedules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Função para atualizar o status das peças baseado no estoque
CREATE OR REPLACE FUNCTION update_part_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock = 0 THEN
    NEW.status = 'out-of-stock';
  ELSIF NEW.current_stock <= NEW.min_stock THEN
    NEW.status = 'low-stock';
  ELSE
    NEW.status = 'in-stock';
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status das peças
CREATE TRIGGER update_part_status_trigger
  BEFORE UPDATE OF current_stock ON parts
  FOR EACH ROW
  EXECUTE FUNCTION update_part_status();

-- Função para atualizar progresso do projeto baseado nas etapas
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_steps integer;
  completed_steps integer;
  new_progress integer;
BEGIN
  -- Contar total de etapas e etapas concluídas
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO total_steps, completed_steps
  FROM project_steps 
  WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
  
  -- Calcular novo progresso
  IF total_steps > 0 THEN
    new_progress = ROUND((completed_steps::decimal / total_steps::decimal) * 100);
  ELSE
    new_progress = 0;
  END IF;
  
  -- Atualizar projeto
  UPDATE projects 
  SET 
    progress_percentage = new_progress,
    updated_at = now()
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso do projeto
CREATE TRIGGER update_project_progress_trigger
  AFTER INSERT OR UPDATE OR DELETE ON project_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_steps_updated_at BEFORE UPDATE ON project_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_parts_updated_at BEFORE UPDATE ON client_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
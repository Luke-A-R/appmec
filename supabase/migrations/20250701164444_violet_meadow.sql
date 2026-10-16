/*
  # Adicionar tabelas para propostas e controle de receita

  1. Nova tabela proposals
    - Armazenar propostas de serviço
    - Status de assinatura
    - Arquivo PDF anexado

  2. Nova tabela revenue_records
    - Controle de receita mensal
    - Categorização de receitas

  3. Atualizar tabela projects
    - Adicionar campos para melhor controle de status
*/

-- Tabela de Propostas
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE CASCADE,
  title text NOT NULL,
  services text[] NOT NULL,
  estimated_price decimal(10,2) NOT NULL,
  estimated_duration text NOT NULL,
  terms text[] NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'rejected', 'expired')),
  pdf_url text,
  signed_pdf_url text,
  signed_date timestamptz,
  expires_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Controle de Receita
CREATE TABLE IF NOT EXISTS revenue_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount decimal(10,2) NOT NULL,
  category text NOT NULL CHECK (category IN ('service', 'parts', 'labor', 'other')),
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'pix', 'transfer', 'check')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'overdue')),
  due_date date,
  paid_date date,
  month_year text NOT NULL, -- Format: YYYY-MM
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar campos aos projetos para melhor controle
ALTER TABLE projects ADD COLUMN IF NOT EXISTS proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS auto_status_update boolean DEFAULT true;

-- Habilitar RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow all operations for everyone" ON proposals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON revenue_records
  FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_records_updated_at BEFORE UPDATE ON revenue_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar status do projeto automaticamente
CREATE OR REPLACE FUNCTION auto_update_project_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Se auto_status_update estiver habilitado
  IF NEW.auto_status_update = true THEN
    -- Se o projeto está sendo iniciado
    IF OLD.status = 'not-started' AND NEW.status = 'in-progress' THEN
      NEW.started_at = now();
    END IF;
    
    -- Se o projeto está sendo finalizado
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      NEW.completed_at = now();
      NEW.actual_completion = CURRENT_DATE;
      
      -- Criar registro de receita automaticamente
      INSERT INTO revenue_records (
        project_id,
        client_id,
        description,
        amount,
        category,
        payment_status,
        month_year
      ) VALUES (
        NEW.id,
        NEW.client_id,
        'Projeto: ' || NEW.title,
        NEW.actual_cost,
        'service',
        'paid',
        TO_CHAR(now(), 'YYYY-MM')
      );
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualização automática de status
CREATE TRIGGER auto_update_project_status_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_project_status();
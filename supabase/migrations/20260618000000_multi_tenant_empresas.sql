/*
  # Tarefa 1: Arquitetura Multi-tenant e RLS
  
  1. Cria tabela `empresas`
  2. Cria tabela `users` (pública, vinculada ao auth.users e empresa_id)
  3. Adiciona `empresa_id` em todas as tabelas operacionais
  4. Ativa RLS e cria policies baseadas no empresa_id do usuário
*/

-- 1. Cria a tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  logo_url text,
  plano_atual text DEFAULT 'freemium',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- 2. Cria a tabela users pública
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
  nome text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. Adiciona empresa_id nas tabelas operacionais
DO $$ 
DECLARE
  table_name text;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['clients', 'vehicles', 'servicos', 'servico_etapas', 'parts', 'client_parts', 'servico_pecas', 'schedules', 'parts_lists', 'orcamentos', 'revenue_records'])
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE', table_name);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

-- Função auxiliar para as policies das tabelas operacionais
-- Usando uma function para não ficar repetindo o select na tabela users
CREATE OR REPLACE FUNCTION get_user_empresa_id() 
RETURNS uuid AS $$
  SELECT empresa_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 4. Policies RLS para empresas e users
CREATE POLICY "Usuários podem ver a própria empresa" ON empresas
  FOR SELECT TO authenticated 
  USING (id = get_user_empresa_id());

CREATE POLICY "Usuários podem ver a própria empresa - Update" ON empresas
  FOR UPDATE TO authenticated 
  USING (id = get_user_empresa_id());

CREATE POLICY "Usuários podem ver o próprio perfil e outros da mesma empresa" ON users
  FOR SELECT TO authenticated 
  USING (
    id = auth.uid() OR 
    empresa_id = get_user_empresa_id()
  );

CREATE POLICY "Usuários podem atualizar o próprio perfil" ON users
  FOR UPDATE TO authenticated 
  USING (id = auth.uid());



-- Remove policies antigas e cria novas para as tabelas operacionais
DO $$ 
DECLARE
  t text;
  pol text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['clients', 'vehicles', 'servicos', 'servico_etapas', 'parts', 'client_parts', 'servico_pecas', 'schedules', 'parts_lists', 'orcamentos', 'revenue_records'])
  LOOP
    -- Drop all existing policies on the table to replace them
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, t);
    END LOOP;
    
    -- Create new policy
    EXECUTE format('
      CREATE POLICY "Acesso restrito à empresa do usuário" ON %I
      FOR ALL TO authenticated 
      USING (empresa_id = get_user_empresa_id())
      WITH CHECK (empresa_id = get_user_empresa_id());
    ', t);
  END LOOP;
END $$;

-- Triggers for updated_at
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


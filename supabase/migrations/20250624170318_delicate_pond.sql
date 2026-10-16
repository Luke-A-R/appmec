/*
  # Atualizar Políticas RLS para Permitir Operações Anônimas

  1. Políticas Atualizadas
    - Permitir operações para usuários anônimos temporariamente
    - Manter segurança básica

  2. Observação
    - Em produção, você deve implementar autenticação adequada
    - Estas políticas são para desenvolvimento/demonstração
*/

-- Remover políticas existentes
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON clients;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON vehicles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON projects;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON project_steps;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON parts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON client_parts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON project_parts;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON schedules;

-- Criar novas políticas que permitem operações anônimas (para desenvolvimento)
CREATE POLICY "Allow all operations for everyone" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON vehicles
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON project_steps
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON parts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON client_parts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON project_parts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for everyone" ON schedules
  FOR ALL USING (true) WITH CHECK (true);
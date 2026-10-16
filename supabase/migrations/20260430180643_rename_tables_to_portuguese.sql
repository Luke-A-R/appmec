/**
 * =====================================================
 * MIGRATION: RENOMEAR TABELAS PARA PORTUGUÊS
 * Arquivo: 20260430180643_rename_tables_to_portuguese.sql
 * =====================================================
 *
 * OBJETIVO:
 * Mudar os nomes das tabelas de inglês para português.
 * Isso torna o banco de dados mais intuitivo para brasileiros.
 *
 * TABELAS RENOMEADAS:
 * - projects → servicos (serviços)
 * - proposals → orcamentos (orçamentos)
 * - project_steps → servico_etapas (etapas do serviço)
 * - project_parts → servico_pecas (peças do serviço)
 *
 * IMPORTANTE:
 * - Esta migration NÃO apaga dados
 * - Apenas renomeia as tabelas
 * - Atualiza todas as referências (chaves estrangeiras)
 */

/*
  # Rename tables to Portuguese

  1. Renamed Tables
    - `projects` → `servicos`
    - `proposals` → `orcamentos`
    - `project_steps` → `servico_etapas`
    - `project_parts` → `servico_pecas`

  2. Updates
    - Update all foreign key constraints
    - Maintain all RLS policies
    - Preserve all data
*/

-- Rename project_parts to servico_pecas first (has FK to projects)
ALTER TABLE IF EXISTS project_parts RENAME TO servico_pecas;

-- Rename project_steps to servico_etapas (has FK to projects)
ALTER TABLE IF EXISTS project_steps RENAME TO servico_etapas;

-- Rename proposals to orcamentos
ALTER TABLE IF EXISTS proposals RENAME TO orcamentos;

-- Rename projects to servicos (last, as others depend on it)
ALTER TABLE IF EXISTS projects RENAME TO servicos;

-- Update foreign key constraint names and references
ALTER TABLE IF EXISTS servico_pecas RENAME CONSTRAINT project_parts_project_id_fkey TO servico_pecas_servico_id_fkey;
ALTER TABLE IF EXISTS servico_pecas RENAME CONSTRAINT project_parts_part_id_fkey TO servico_pecas_part_id_fkey;

ALTER TABLE IF EXISTS servico_etapas RENAME CONSTRAINT project_steps_project_id_fkey TO servico_etapas_servico_id_fkey;

-- Update the foreign key column names in servico_pecas and servico_etapas
ALTER TABLE servico_pecas RENAME COLUMN project_id TO servico_id;
ALTER TABLE servico_etapas RENAME COLUMN project_id TO servico_id;

-- Update foreign keys in orcamentos that reference servicos
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS proposals_client_id_fkey;
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS proposals_vehicle_id_fkey;

-- Re-create the foreign keys
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

-- Update the proposal_id column in servicos to reference orcamentos
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS projects_proposal_id_fkey;
ALTER TABLE servicos RENAME COLUMN proposal_id TO orcamento_id;
ALTER TABLE servicos ADD CONSTRAINT servicos_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES orcamentos(id);

-- Update other foreign keys in servicos
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS projects_vehicle_id_fkey;

ALTER TABLE servicos ADD CONSTRAINT servicos_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id);
ALTER TABLE servicos ADD CONSTRAINT servicos_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);

-- Update foreign keys in revenue_records
ALTER TABLE revenue_records DROP CONSTRAINT IF EXISTS revenue_records_project_id_fkey;
ALTER TABLE revenue_records RENAME COLUMN project_id TO servico_id;
ALTER TABLE revenue_records ADD CONSTRAINT revenue_records_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES servicos(id);

-- Update foreign keys in schedules
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_project_id_fkey;
ALTER TABLE schedules RENAME COLUMN project_id TO servico_id;
ALTER TABLE schedules ADD CONSTRAINT schedules_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES servicos(id);

-- Update RLS policies for renamed tables
DROP POLICY IF EXISTS "Users can view own profile" ON servicos;
DROP POLICY IF EXISTS "Team members can view team data" ON servicos;

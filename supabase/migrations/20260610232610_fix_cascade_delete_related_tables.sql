/**
 * =====================================================
 * MIGRATION: CORRIGIR CASCADE DELETE DE VEÍCULOS E SERVIÇOS
 * Arquivo: 20260610232610_fix_cascade_delete_related_tables.sql
 * =====================================================
 *
 * OBJETIVO:
 * Garantir que, ao excluir um veículo ou serviço, os registros
 * relacionados sejam tratados corretamente.
 *
 * O QUE ESTA MIGRATION FAZ:
 * 1. Veículos: Apaga orçamentos, serviços e peças vinculados
 * 2. Serviços: Apaga etapas e peças vinculadas
 * 3. Peças: IMPEDE exclusão se estiver sendo usada
 *
 * TIPOS DE DELETE:
 * - CASCADE: Apaga automaticamente os relacionados
 * - SET NULL: Mantém o registro, remove referência
 * - RESTRICT: IMPEDE a exclusão se houver dependentes
 */

-- Fix cascade delete for vehicles and servicos tables

-- ========================================
-- VEÍCULOS: CHAVES ESTRANGEIRAS
-- ========================================
-- Quando apagar um veículo, apaga tudo relacionado

-- Remove constraints antigas
-- Vehicles foreign keys
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_vehicle_id_fkey;
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS servicos_vehicle_id_fkey;
ALTER TABLE client_parts DROP CONSTRAINT IF EXISTS client_parts_vehicle_id_fkey;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_vehicle_id_fkey;

-- Adiciona com CASCADE (apaga junto)
ALTER TABLE orcamentos
  ADD CONSTRAINT orcamentos_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

ALTER TABLE servicos
  ADD CONSTRAINT servicos_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

ALTER TABLE client_parts
  ADD CONSTRAINT client_parts_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;

-- Agendamentos: SET NULL (mantém registro sem veículo)
ALTER TABLE schedules
  ADD CONSTRAINT schedules_vehicle_id_fkey
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;

-- ========================================
-- SERVIÇOS (SERVICOS): CHAVES ESTRANGEIRAS
-- ========================================
-- Quando apagar um serviço, apaga tudo relacionado

-- Remove constraints antigas
-- Servicos (services) foreign keys
ALTER TABLE servico_etapas DROP CONSTRAINT IF EXISTS servico_etapas_servico_id_fkey;
ALTER TABLE servico_pecas DROP CONSTRAINT IF EXISTS servico_pecas_servico_id_fkey;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_servico_id_fkey;
ALTER TABLE revenue_records DROP CONSTRAINT IF EXISTS revenue_records_servico_id_fkey;

-- Adiciona com CASCADE (apaga junto)
ALTER TABLE servico_etapas
  ADD CONSTRAINT servico_etapas_servico_id_fkey
  FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE;

ALTER TABLE servico_pecas
  ADD CONSTRAINT servico_pecas_servico_id_fkey
  FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE CASCADE;

-- Agendamentos e Receitas: SET NULL (mantém histórico)
ALTER TABLE schedules
  ADD CONSTRAINT schedules_servico_id_fkey
  FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE SET NULL;

ALTER TABLE revenue_records
  ADD CONSTRAINT revenue_records_servico_id_fkey
  FOREIGN KEY (servico_id) REFERENCES servicos(id) ON DELETE SET NULL;

-- ========================================
-- PEÇAS: CHAVES ESTRANGEIRAS COM RESTRICT
-- ========================================
-- IMPEDE apagar peça se ela está sendo usada
-- Isso evita perda de dados importante

-- Parts foreign keys
ALTER TABLE servico_pecas DROP CONSTRAINT IF EXISTS servico_pecas_part_id_fkey;
ALTER TABLE client_parts DROP CONSTRAINT IF EXISTS client_parts_part_id_fkey;

-- RESTRICT: Não permite apagar peça se está em uso
-- Se tentar apagar, dará erro explicando que tem dependência
ALTER TABLE servico_pecas
  ADD CONSTRAINT servico_pecas_part_id_fkey
  FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT;

ALTER TABLE client_parts
  ADD CONSTRAINT client_parts_part_id_fkey
  FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT;

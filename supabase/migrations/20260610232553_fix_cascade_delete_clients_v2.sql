/**
 * =====================================================
 * MIGRATION: CORRIGIR CASCADE DELETE DE CLIENTES
 * Arquivo: 20260610232553_fix_cascade_delete_clients_v2.sql
 * =====================================================
 *
 * OBJETIVO:
 * Permitir que, ao excluir um cliente, TODOS os registros
 * relacionados sejam excluídos automaticamente.
 *
 * PROBLEMA QUE RESOLVE:
 * Antes desta migration, tentar excluir um cliente falhava
 * porque existiam registros vinculados a ele.
 *
 * O QUE É CASCADE DELETE:
 * Quando você apaga um cliente:
 * - Os veículos dele são apagados automaticamente
 * - Os serviços dele são apagados automaticamente
 * - Os orçamentos dele são apagados automaticamente
 * - As peças que ele trouxe são apagadas
 *
 * ON DELETE CASCADE = Apaga automaticamente
 * ON DELETE SET NULL = Deixa o registro, mas remove a referência
 */

-- Fix cascade delete for clients table
-- This allows deleting a client and automatically deletes all related records

-- ========================================
-- PASSO 1: REMOVER CONSTRAINTS ANTIGAS
-- ========================================
-- Primeiro remove as chaves estrangeiras existentes
-- First, drop existing foreign key constraints
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_client_id_fkey;
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_client_id_fkey;
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS servicos_client_id_fkey;
ALTER TABLE client_parts DROP CONSTRAINT IF EXISTS client_parts_client_id_fkey;
ALTER TABLE revenue_records DROP CONSTRAINT IF EXISTS revenue_records_client_id_fkey;
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_client_id_fkey;

-- ========================================
-- PASSO 2: RECRIAR COM CASCADE DELETE
-- ========================================
-- Agora adiciona as constraints com CASCADE
-- Recreate with CASCADE delete

-- Veículos: Apaga junto com o cliente
ALTER TABLE vehicles
  ADD CONSTRAINT vehicles_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Orçamentos: Apaga junto com o cliente
ALTER TABLE orcamentos
  ADD CONSTRAINT orcamentos_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Serviços: Apaga junto com o cliente
ALTER TABLE servicos
  ADD CONSTRAINT servicos_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- Peças do cliente: Apaga junto com o cliente
ALTER TABLE client_parts
  ADD CONSTRAINT client_parts_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

-- ========================================
-- PASSO 3: TABELAS COM SET NULL
-- ========================================
-- Estas tabelas mantêm o registro, mas removem a referência
-- Isso é útil para histórico financeiro e agenda

-- Receitas: Mantém o registro, mas remove referência do cliente
ALTER TABLE revenue_records
  ADD CONSTRAINT revenue_records_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Agendamentos: Mantém o registro, mas remove referência do cliente
ALTER TABLE schedules
  ADD CONSTRAINT schedules_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

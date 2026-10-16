/*
  # Limpeza de receitas duplicadas e inválidas

  1. Remove receitas com valor zero
  2. Remove receitas sem cliente válido
  3. Remove receitas com descrição vazia
  4. Remove receitas duplicadas
*/

-- Remove receitas com valor zero ou negativo
DELETE FROM revenue_records 
WHERE amount <= 0;

-- Remove receitas sem cliente válido
DELETE FROM revenue_records 
WHERE client_id IS NULL 
   OR client_id NOT IN (SELECT id FROM clients);

-- Remove receitas com descrição vazia
DELETE FROM revenue_records 
WHERE description IS NULL 
   OR TRIM(description) = '';

-- Remove receitas duplicadas (mantém apenas a mais recente)
DELETE FROM revenue_records 
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, description, amount, category, payment_method, month_year) id
  FROM revenue_records 
  ORDER BY client_id, description, amount, category, payment_method, month_year, created_at DESC
);

-- Atualiza estatísticas da tabela
ANALYZE revenue_records;
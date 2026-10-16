/*
  # Limpeza de receitas duplicadas

  1. Remove receitas com valor 0
  2. Remove receitas duplicadas do mesmo cliente
  3. Mantém apenas receitas válidas
*/

-- Remove receitas com valor 0 ou nulo
DELETE FROM revenue_records 
WHERE amount = 0 OR amount IS NULL;

-- Remove receitas duplicadas (mantém apenas a mais recente de cada cliente)
DELETE FROM revenue_records 
WHERE id NOT IN (
  SELECT DISTINCT ON (client_id, description, amount) id
  FROM revenue_records
  ORDER BY client_id, description, amount, created_at DESC
);

-- Remove receitas sem cliente válido
DELETE FROM revenue_records 
WHERE client_id NOT IN (SELECT id FROM clients);

-- Remove receitas com descrição vazia
DELETE FROM revenue_records 
WHERE description IS NULL OR TRIM(description) = '';
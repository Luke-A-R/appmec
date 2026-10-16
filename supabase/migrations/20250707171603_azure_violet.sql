/*
  # Adicionar coluna parts à tabela proposals

  1. Mudanças
    - Adicionar coluna `parts` à tabela `proposals` (array de texto, padrão array vazio)
  
  2. Notas
    - Esta coluna armazenará a lista de peças que serão trocadas na proposta
    - Valor padrão é array vazio para compatibilidade com registros existentes
*/

-- Adicionar coluna parts à tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'parts'
  ) THEN
    ALTER TABLE proposals ADD COLUMN parts text[] DEFAULT '{}';
  END IF;
END $$;
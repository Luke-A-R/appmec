/*
  # Fix trigger function to use new table and column names

  1. Update
    - Fix update_project_progress() function to reference servico_etapas instead of project_steps
    - Fix column references from project_id to servico_id
    - Fix table reference from projects to servicos
*/

-- Drop the old trigger function and recreate with correct names
DROP FUNCTION IF EXISTS public.update_project_progress() CASCADE;

CREATE OR REPLACE FUNCTION public.update_project_progress()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
  FROM servico_etapas 
  WHERE servico_id = COALESCE(NEW.servico_id, OLD.servico_id);
  
  -- Calcular novo progresso
  IF total_steps > 0 THEN
    new_progress = ROUND((completed_steps::decimal / total_steps::decimal) * 100);
  ELSE
    new_progress = 0;
  END IF;
  
  -- Atualizar serviço
  UPDATE servicos 
  SET 
    progress_percentage = new_progress,
    updated_at = now()
  WHERE id = COALESCE(NEW.servico_id, OLD.servico_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_project_progress_trigger ON servico_etapas;

CREATE TRIGGER update_project_progress_trigger
  AFTER INSERT OR DELETE OR UPDATE ON servico_etapas
  FOR EACH ROW
  EXECUTE FUNCTION update_project_progress();

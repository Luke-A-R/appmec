/*
  # Tarefa 2: Preparação de Storage e Automação de Usuários
  
  1. Cria bucket público no Supabase Storage chamado logos
  2. Adiciona RLS permitindo que usuários autenticados façam upload e qualquer pessoa possa ler
  3. Cria function e trigger no PostgreSQL para inserir dados de novos usuários no Auth na tabela public.users
*/

-- 1 e 2. Cria bucket public 'logos' e políticas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket logos
CREATE POLICY "Qualquer pessoa pode ler logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

CREATE POLICY "Usuários autenticados podem fazer upload de logos" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Usuários autenticados podem atualizar logos" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'logos');

-- 3. Function e Trigger para automatizar inserção de users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, nome)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


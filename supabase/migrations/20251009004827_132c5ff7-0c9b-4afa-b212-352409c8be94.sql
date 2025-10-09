-- Primeiro, apagar todos os dados das tabelas relacionadas
DELETE FROM public.orders;
DELETE FROM public.products;
DELETE FROM public.daily_transactions;
DELETE FROM public.establishments;
DELETE FROM public.users;

-- Apagar todos os usuários do auth
DELETE FROM auth.users;

-- Recriar a função handle_new_user para incluir o email corretamente
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Erro ao criar usuário na tabela users: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
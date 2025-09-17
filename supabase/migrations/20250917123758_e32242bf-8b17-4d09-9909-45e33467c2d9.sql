-- Update the handle_new_user function to use the correct column name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  request_id uuid;
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  -- Auto-confirm the user by calling our edge function
  SELECT
    net.http_post(
      url := 'https://lstbjfcupoowfeunlcly.supabase.co/functions/v1/auto-confirm-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdGJqZmN1cG9vd2ZldW5sY2x5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjgxNTk3MywiZXhwIjoyMDUyMzkxOTczfQ.1_LGHyBWVXEEoGgHlm8CyLpivSPIQUZ0NqGJf5-aBuE'
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    ) INTO request_id;

  RETURN NEW;
END;
$$;
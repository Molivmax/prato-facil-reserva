-- Create a webhook to auto-confirm users on signup
-- This will trigger our edge function to confirm users automatically

-- We'll create a trigger that calls the edge function when a user is created
CREATE OR REPLACE FUNCTION public.trigger_auto_confirm_user()
RETURNS trigger AS $$
DECLARE
  request_id uuid;
BEGIN
  -- Call the auto-confirm edge function
  SELECT
    net.http_post(
      url := 'https://lstbjfcupoowfeunlcly.supabase.co/functions/v1/auto-confirm-user',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    ) INTO request_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (but we can't directly trigger on auth schema)
-- Instead, we'll modify the existing handle_new_user function to include auto-confirmation

-- Update the existing function to auto-confirm users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
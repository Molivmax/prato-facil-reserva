-- Auto-confirm all existing users who haven't been confirmed yet
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
-- Manually confirm the test user
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'teste@teste.com' 
AND email_confirmed_at IS NULL;
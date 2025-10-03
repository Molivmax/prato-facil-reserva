-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;

-- Create trigger to auto-confirm users on signup
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_confirm_user();
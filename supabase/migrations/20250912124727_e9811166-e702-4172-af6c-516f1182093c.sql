-- Add email field to establishments table
ALTER TABLE public.establishments 
ADD COLUMN email text;

-- Create index for better performance on email lookups
CREATE INDEX idx_establishments_email ON public.establishments(email);

-- Update RLS policies to allow establishments to update their own data
CREATE POLICY "Establishments can update their own data" 
ON public.establishments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow establishments to delete their own data
CREATE POLICY "Establishments can delete their own data" 
ON public.establishments 
FOR DELETE 
USING (auth.uid() = user_id);
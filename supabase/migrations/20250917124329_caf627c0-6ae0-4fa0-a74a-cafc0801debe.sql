-- Create table for daily transactions/orders tracking
CREATE TABLE public.daily_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  table_number integer NOT NULL,
  customer_name text,
  customer_phone text,
  total_amount numeric(10,2) NOT NULL,
  payment_method text CHECK (payment_method IN ('credit', 'app', 'local')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_time timestamp with time zone DEFAULT now(),
  order_items jsonb, -- Store order items as JSON
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for daily transactions
CREATE POLICY "Establishments can view their own transactions" 
ON public.daily_transactions 
FOR SELECT 
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can insert their own transactions" 
ON public.daily_transactions 
FOR INSERT 
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can update their own transactions" 
ON public.daily_transactions 
FOR UPDATE 
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_daily_transactions_establishment_date ON public.daily_transactions(establishment_id, transaction_date);
CREATE INDEX idx_daily_transactions_table ON public.daily_transactions(establishment_id, table_number, transaction_date);
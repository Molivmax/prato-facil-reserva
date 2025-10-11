-- Permitir que clientes com pedidos ativos possam ler a public_key do MP
-- (necessário para processar pagamentos no frontend)
CREATE POLICY "Customers with active orders can view MP public key"
ON public.establishment_mp_credentials
FOR SELECT
USING (
  -- Permitir leitura se o usuário tem um pedido ativo neste estabelecimento
  establishment_id IN (
    SELECT establishment_id 
    FROM public.orders 
    WHERE user_id = auth.uid() 
    AND payment_status = 'pending'
  )
);
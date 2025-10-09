-- Adicionar política para permitir que usuários excluam seus próprios pedidos
CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
USING (auth.uid() = user_id);
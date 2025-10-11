-- Criar policy para estabelecimentos poderem visualizar dados de clientes que fizeram pedidos
CREATE POLICY "Establishments can view customer info for their orders"
ON users FOR SELECT
USING (
  id IN (
    SELECT user_id FROM orders
    WHERE establishment_id IN (
      SELECT id FROM establishments WHERE user_id = auth.uid()
    )
  )
);
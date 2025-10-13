-- Adicionar coluna customer_status para rastrear status do cliente
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_status TEXT DEFAULT 'pending';

-- Comentário: Estados possíveis: 'pending', 'on_the_way', 'arrived', 'seated'

-- Atualizar pedidos existentes que já têm localização
UPDATE orders 
SET customer_status = 'on_the_way'
WHERE customer_location IS NOT NULL 
  AND estimated_arrival_time IS NOT NULL
  AND order_status = 'confirmed'
  AND customer_status = 'pending';
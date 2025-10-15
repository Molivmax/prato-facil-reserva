-- Correção completa de duplicatas e atribuição de mesas

-- Passo 1: Vincular transações antigas sem order_id ao pedido correto
UPDATE daily_transactions dt
SET order_id = o.id
FROM orders o
WHERE dt.order_id IS NULL
  AND dt.establishment_id = o.establishment_id
  AND dt.transaction_date = o.created_at::date
  AND ABS(dt.total_amount - o.total_amount) < 0.01
  AND dt.transaction_time = o.updated_at;

-- Passo 2: Deletar duplicatas (manter apenas a mais antiga para cada order_id)
DELETE FROM daily_transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (order_id)
    id
  FROM daily_transactions
  WHERE order_id IS NOT NULL
  ORDER BY order_id, created_at ASC
)
AND order_id IS NOT NULL;

-- Passo 3: Deletar transações órfãs (sem order_id que não conseguimos vincular)
DELETE FROM daily_transactions
WHERE order_id IS NULL;

-- Passo 4: Atualizar table_number para usar assigned_table quando disponível
UPDATE daily_transactions dt
SET table_number = o.assigned_table
FROM orders o
WHERE dt.order_id = o.id
  AND o.assigned_table IS NOT NULL
  AND dt.table_number != o.assigned_table;
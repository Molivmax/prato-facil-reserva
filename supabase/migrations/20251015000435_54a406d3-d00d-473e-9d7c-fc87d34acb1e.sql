-- Passo 1: Adicionar coluna order_id para rastreamento único
ALTER TABLE daily_transactions 
ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES orders(id);

CREATE INDEX IF NOT EXISTS idx_daily_transactions_order_id 
ON daily_transactions(order_id);

-- Passo 2: Restaurar transações deletadas incorretamente
INSERT INTO daily_transactions (
  establishment_id,
  table_number,
  total_amount,
  payment_method,
  status,
  order_items,
  customer_name,
  customer_phone,
  transaction_date,
  transaction_time,
  order_id
)
SELECT 
  o.establishment_id,
  COALESCE(o.assigned_table, o.table_number),
  o.total_amount,
  o.payment_method,
  'completed',
  o.items,
  u.name,
  u.phone,
  o.created_at::date,
  o.updated_at,
  o.id
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM daily_transactions dt
    WHERE dt.establishment_id = o.establishment_id
      AND dt.transaction_date = o.created_at::date
      AND ABS(dt.total_amount - o.total_amount) < 0.01
      AND dt.transaction_time = o.updated_at
  );

-- Passo 3: Atualizar função do trigger para usar order_id
CREATE OR REPLACE FUNCTION insert_daily_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Verifica se já existe transação para este order_id específico
    IF NOT EXISTS (
      SELECT 1 FROM daily_transactions dt
      WHERE dt.order_id = NEW.id
    ) THEN
      INSERT INTO daily_transactions (
        establishment_id,
        table_number,
        total_amount,
        payment_method,
        status,
        order_items,
        customer_name,
        customer_phone,
        transaction_date,
        transaction_time,
        order_id
      )
      SELECT 
        NEW.establishment_id,
        COALESCE(NEW.assigned_table, NEW.table_number),
        NEW.total_amount,
        NEW.payment_method,
        'completed',
        NEW.items,
        u.name,
        u.phone,
        NEW.created_at::date,
        NEW.updated_at,
        NEW.id
      FROM users u
      WHERE u.id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Passo 4: Limpar apenas duplicatas reais (mesmo order_id registrado mais de uma vez)
DELETE FROM daily_transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (establishment_id, transaction_date, total_amount, transaction_time)
    id
  FROM daily_transactions
  WHERE order_id IS NULL
  ORDER BY establishment_id, transaction_date, total_amount, transaction_time, created_at ASC
)
AND order_id IS NULL;
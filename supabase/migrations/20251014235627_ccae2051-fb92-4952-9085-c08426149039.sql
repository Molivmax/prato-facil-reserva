-- Passo 1: Atualizar função do trigger para usar assigned_table e evitar duplicatas
CREATE OR REPLACE FUNCTION insert_daily_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Só insere se o pagamento foi confirmado E não existe transação já registrada
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Verificar se já existe uma transação para este pedido
    IF NOT EXISTS (
      SELECT 1 FROM daily_transactions dt
      WHERE dt.establishment_id = NEW.establishment_id
        AND dt.transaction_date = NEW.created_at::date
        AND ABS(dt.total_amount - NEW.total_amount) < 0.01
        AND dt.transaction_time = NEW.updated_at
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
        transaction_time
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
        NEW.updated_at
      FROM users u
      WHERE u.id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Passo 2: Limpar duplicatas mantendo apenas a mais antiga
DELETE FROM daily_transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (establishment_id, transaction_date, total_amount, transaction_time)
    id
  FROM daily_transactions
  ORDER BY establishment_id, transaction_date, total_amount, transaction_time, created_at ASC
);

-- Passo 3: Corrigir table_number nas transações existentes
UPDATE daily_transactions dt
SET table_number = o.assigned_table
FROM orders o
WHERE dt.establishment_id = o.establishment_id
  AND dt.transaction_date = o.created_at::date
  AND ABS(dt.total_amount - o.total_amount) < 0.01
  AND o.assigned_table IS NOT NULL
  AND dt.table_number != o.assigned_table;
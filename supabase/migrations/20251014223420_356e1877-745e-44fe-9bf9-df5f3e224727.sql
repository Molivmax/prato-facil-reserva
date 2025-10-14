-- Drop old payment method constraint
ALTER TABLE daily_transactions DROP CONSTRAINT IF EXISTS daily_transactions_payment_method_check;

-- Add updated constraint with all payment methods
ALTER TABLE daily_transactions ADD CONSTRAINT daily_transactions_payment_method_check 
CHECK (payment_method IN ('credit', 'app', 'local', 'pix', 'pay_at_location'));

-- Create function to automatically insert daily transactions when payment is confirmed
CREATE OR REPLACE FUNCTION insert_daily_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if payment was confirmed (changed to 'paid')
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
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
      NEW.table_number,
      NEW.total_amount,
      NEW.payment_method,
      'completed',
      NEW.items,
      u.name,
      u.phone,
      CURRENT_DATE,
      NEW.updated_at
    FROM users u
    WHERE u.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to execute the function when orders are updated
CREATE TRIGGER order_payment_confirmed_trigger
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.payment_status = 'paid')
EXECUTE FUNCTION insert_daily_transaction();

-- Populate missing transactions from last 30 days
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
  o.establishment_id, 
  o.table_number, 
  o.total_amount, 
  o.payment_method,
  'completed', 
  o.items, 
  u.name, 
  u.phone, 
  o.created_at::date,
  o.updated_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.payment_status = 'paid'
  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM daily_transactions dt
    WHERE dt.establishment_id = o.establishment_id
      AND dt.table_number = o.table_number
      AND dt.transaction_date = o.created_at::date
      AND ABS(dt.total_amount - o.total_amount) < 0.01
      AND dt.transaction_time = o.updated_at
  );
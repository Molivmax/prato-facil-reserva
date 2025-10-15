-- Limpeza corrigida: remover duplicatas por establishment_id + transaction_date + total_amount
-- Mantém apenas a transação mais antiga para cada combinação única
DELETE FROM daily_transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (establishment_id, transaction_date, total_amount)
    id
  FROM daily_transactions
  ORDER BY establishment_id, transaction_date, total_amount, created_at ASC
);
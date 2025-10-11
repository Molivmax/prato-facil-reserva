-- Adicionar coluna party_size (número de pessoas) na tabela orders
ALTER TABLE orders 
ADD COLUMN party_size INTEGER DEFAULT 2;

-- Adicionar coluna assigned_table (mesa atribuída pelo restaurante) na tabela orders
ALTER TABLE orders 
ADD COLUMN assigned_table INTEGER;
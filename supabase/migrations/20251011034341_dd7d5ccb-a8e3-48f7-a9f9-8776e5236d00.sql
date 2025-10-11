-- Garantir que a tabela orders está configurada para real-time
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Adicionar a tabela à publicação do real-time
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
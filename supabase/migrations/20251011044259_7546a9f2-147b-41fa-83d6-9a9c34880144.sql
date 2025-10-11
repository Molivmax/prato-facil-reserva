-- Habilitar real-time na tabela orders para confirmação automática de pagamento PIX
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime se ainda não estiver
DO $$
BEGIN
  -- Verificar se a tabela já está na publicação
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
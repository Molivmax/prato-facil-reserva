-- Criar tabela de notificações de clientes
CREATE TABLE public.customer_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  establishment_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  message TEXT,
  table_number INTEGER,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS
ALTER TABLE public.customer_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Estabelecimentos podem ver notificações dos seus pedidos
CREATE POLICY "Establishments can view their notifications"
ON public.customer_notifications
FOR SELECT
USING (establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
));

-- Policy: Clientes podem criar notificações para seus pedidos
CREATE POLICY "Customers can create notifications for their orders"
ON public.customer_notifications
FOR INSERT
WITH CHECK (order_id IN (
  SELECT id FROM orders WHERE user_id = auth.uid()
));

-- Policy: Estabelecimentos podem atualizar suas notificações
CREATE POLICY "Establishments can update their notifications"
ON public.customer_notifications
FOR UPDATE
USING (establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
));

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_notifications;
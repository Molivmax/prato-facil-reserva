-- Tabela para armazenar credenciais OAuth do Mercado Pago dos estabelecimentos
CREATE TABLE IF NOT EXISTS public.establishment_mp_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  public_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(establishment_id)
);

-- Índice para buscar credenciais por establishment_id
CREATE INDEX IF NOT EXISTS idx_mp_credentials_establishment ON public.establishment_mp_credentials(establishment_id);

-- Enable RLS
ALTER TABLE public.establishment_mp_credentials ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Apenas o dono do estabelecimento pode ver/editar suas credenciais
CREATE POLICY "Establishments can view their own MP credentials"
ON public.establishment_mp_credentials
FOR SELECT
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can insert their own MP credentials"
ON public.establishment_mp_credentials
FOR INSERT
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can update their own MP credentials"
ON public.establishment_mp_credentials
FOR UPDATE
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can delete their own MP credentials"
ON public.establishment_mp_credentials
FOR DELETE
USING (
  establishment_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_establishment_mp_credentials_updated_at
BEFORE UPDATE ON public.establishment_mp_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
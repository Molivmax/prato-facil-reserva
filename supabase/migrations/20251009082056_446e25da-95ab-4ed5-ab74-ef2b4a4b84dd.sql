-- Inserir credenciais de produção do Mercado Pago para o estabelecimento
INSERT INTO establishment_mp_credentials (
  establishment_id,
  access_token,
  public_key,
  seller_id,
  token_type
) VALUES (
  'b1f65caf-df64-4a9f-b3c2-9c64f259a276',
  'APP_USR-1453723522108659-100902-2fe68a86d5aa4bbf4875aab82f7420e4-1454041117',
  'APP_USR-3ae9076d-38dd-49c6-93db-4e578b332243',
  '1454041117',
  'Bearer'
);
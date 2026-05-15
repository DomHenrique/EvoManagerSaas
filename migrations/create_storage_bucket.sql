-- ============================================================================
-- STORAGE BUCKET PARA ARQUIVOS DE MÍDIA
-- ============================================================================

-- Criar bucket para armazenar mídias das mensagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-media', 'message-media', true)
ON CONFLICT (id) DO NOTHING;

-- Garantir que as políticas antigas sejam removidas antes de criar (evita erros ao rodar novamente)
DROP POLICY IF EXISTS "Users can upload their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;

-- Criar política para permitir upload de arquivos
CREATE POLICY "Users can upload their own media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar política para permitir leitura pública
CREATE POLICY "Public can view media files"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-media');

-- Criar política para permitir usuários deletarem seus próprios arquivos
CREATE POLICY "Users can delete their own media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Criar política para permitir usuários atualizarem seus próprios arquivos
CREATE POLICY "Users can update their own media files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================
-- (Comando 'COMMENT ON TABLE' removido para evitar erro de permissão)

-- Estrutura de pastas no bucket:
-- message-media/
--   {user_id}/
--     {timestamp}.{ext}
--
-- Exemplo:
-- message-media/
--   550e8400-e29b-41d4-a716-446655440000/
--     1703001234567.jpg
--     1703001234568.mp4
--     1703001234569.pdf

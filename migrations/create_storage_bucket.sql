-- ============================================================================
-- STORAGE BUCKET PARA ARQUIVOS DE MÍDIA
-- ============================================================================

-- Criar bucket para armazenar mídias das mensagens
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-media', 'message-media', true)
ON CONFLICT (id) DO NOTHING;

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

COMMENT ON TABLE storage.buckets IS 'Buckets de armazenamento do Supabase Storage';

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

-- ============================================================================
-- 🧪 SCRIPT DE VERIFICAÇÃO DE INSTÂNCIAS
-- ============================================================================
-- Este script verifica a configuração e dados da tabela de instâncias
-- Execute no Supabase SQL Editor para diagnosticar problemas
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar se a tabela existe
-- ============================================================================

SELECT 
  'Tabela instances existe' as status,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'instances';

-- ============================================================================
-- PASSO 2: Verificar estrutura da tabela
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'instances'
ORDER BY ordinal_position;

-- ============================================================================
-- PASSO 3: Verificar políticas RLS
-- ============================================================================

SELECT 
  policyname as policy_name,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'instances';

-- ============================================================================
-- PASSO 4: Verificar se RLS está ativo
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'instances';

-- ============================================================================
-- PASSO 5: Obter seu user_id atual
-- ============================================================================

SELECT 
  auth.uid() as current_user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user_email;

-- ============================================================================
-- PASSO 6: Contar instâncias por usuário
-- ============================================================================

SELECT 
  user_id,
  (SELECT email FROM auth.users WHERE id = instances.user_id) as user_email,
  COUNT(*) as total_instances,
  SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as connected,
  SUM(CASE WHEN status = 'close' THEN 1 ELSE 0 END) as disconnected
FROM instances
GROUP BY user_id;

-- ============================================================================
-- PASSO 7: Listar todas as instâncias do usuário atual
-- ============================================================================

SELECT 
  instanceName,
  status,
  profileName,
  owner,
  integration,
  created_at,
  connected_at,
  disconnected_at
FROM instances
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- ============================================================================
-- PASSO 8: Verificar se a função insert_test_instances existe
-- ============================================================================

SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'insert_test_instances';

-- ============================================================================
-- PASSO 9: Inserir instâncias de teste (DESCOMENTE PARA EXECUTAR)
-- ============================================================================

-- SELECT insert_test_instances(auth.uid());

-- ============================================================================
-- PASSO 10: Verificar instâncias de teste criadas
-- ============================================================================

SELECT 
  instanceName,
  status,
  profileName,
  created_at,
  CASE 
    WHEN status = 'open' THEN '✅ Conectada'
    WHEN status = 'close' THEN '❌ Desconectada'
    ELSE '⚠️ ' || status
  END as status_display
FROM instances
WHERE user_id = auth.uid()
  AND instanceName LIKE 'instance_test_%'
ORDER BY instanceName;

-- ============================================================================
-- PASSO 11: Estatísticas gerais
-- ============================================================================

SELECT 
  'Total de instâncias' as metric,
  COUNT(*)::text as value
FROM instances
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Instâncias conectadas' as metric,
  COUNT(*)::text as value
FROM instances
WHERE user_id = auth.uid()
  AND status = 'open'

UNION ALL

SELECT 
  'Instâncias desconectadas' as metric,
  COUNT(*)::text as value
FROM instances
WHERE user_id = auth.uid()
  AND status = 'close'

UNION ALL

SELECT 
  'Última criação' as metric,
  TO_CHAR(MAX(created_at), 'YYYY-MM-DD HH24:MI:SS') as value
FROM instances
WHERE user_id = auth.uid()

UNION ALL

SELECT 
  'Última conexão' as metric,
  TO_CHAR(MAX(connected_at), 'YYYY-MM-DD HH24:MI:SS') as value
FROM instances
WHERE user_id = auth.uid()
  AND connected_at IS NOT NULL;

-- ============================================================================
-- PASSO 12: Verificar índices
-- ============================================================================

SELECT 
  indexname as index_name,
  indexdef as index_definition
FROM pg_indexes
WHERE tablename = 'instances';

-- ============================================================================
-- PASSO 13: Verificar triggers
-- ============================================================================

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'instances';

-- ============================================================================
-- COMANDOS ÚTEIS PARA TROUBLESHOOTING
-- ============================================================================

-- Resetar status de todas as instâncias para 'open' (TESTE)
-- UPDATE instances
-- SET status = 'open', connected_at = NOW(), disconnected_at = NULL
-- WHERE user_id = auth.uid();

-- Deletar todas as instâncias de teste
-- DELETE FROM instances
-- WHERE user_id = auth.uid()
--   AND instanceName LIKE 'instance_test_%';

-- Deletar TODAS as instâncias do usuário atual (CUIDADO!)
-- DELETE FROM instances
-- WHERE user_id = auth.uid();

-- Inserir uma instância manualmente
-- INSERT INTO instances (
--   instanceName,
--   instanceId,
--   status,
--   profileName,
--   user_id,
--   integration,
--   connected_at
-- ) VALUES (
--   'manual_test_instance',
--   'manual-test-id',
--   'open',
--   'Instância Manual de Teste',
--   auth.uid(),
--   'WHATSAPP-BAILEYS',
--   NOW()
-- );

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================

-- Se tudo estiver correto, você deve ver:
-- ✅ Tabela 'instances' existe com todas as colunas
-- ✅ RLS está ativo (rls_enabled = true)
-- ✅ 4 políticas RLS (SELECT, INSERT, UPDATE, DELETE)
-- ✅ Função 'insert_test_instances' existe
-- ✅ Pelo menos 3 instâncias de teste (instance_test_1, instance_test_2, instance_test_3)
-- ✅ Pelo menos 2 instâncias com status 'open'

-- ============================================================================
-- PRÓXIMOS PASSOS
-- ============================================================================

-- 1. Se a tabela não existe:
--    → Execute o arquivo: migrations/create_instances_table.sql

-- 2. Se não há instâncias:
--    → Execute: SELECT insert_test_instances(auth.uid());

-- 3. Se as instâncias não aparecem na aplicação:
--    → Verifique o console do navegador (F12)
--    → Verifique se está logado com o usuário correto
--    → Limpe o cache do navegador (Ctrl + Shift + R)

-- 4. Para testar no navegador:
--    → Abra a página /instances
--    → As instâncias devem aparecer automaticamente
--    → Verifique os logs no console do navegador

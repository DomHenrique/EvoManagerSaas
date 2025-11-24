-- ============================================================================
-- TABELA DE INSTÂNCIAS DO EVOLUTION API
-- ============================================================================

-- Criar tabela de instâncias se não existir
CREATE TABLE IF NOT EXISTS instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instanceName TEXT NOT NULL,
  instanceId TEXT,
  status TEXT NOT NULL DEFAULT 'close',
  owner TEXT,
  profileName TEXT,
  profilePictureUrl TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadados adicionais
  qrcode TEXT,
  integration TEXT DEFAULT 'WHATSAPP-BAILEYS',
  webhook_url TEXT,
  webhook_events TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraint para garantir unicidade por usuário
  UNIQUE(instanceName, user_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_instances_user_id ON instances(user_id);
CREATE INDEX IF NOT EXISTS idx_instances_status ON instances(status);
CREATE INDEX IF NOT EXISTS idx_instances_instanceName ON instances(instanceName);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE instances ENABLE ROW LEVEL SECURITY;

-- Política para visualizar instâncias
CREATE POLICY "Users can view their own instances"
  ON instances FOR SELECT
  USING (auth.uid() = user_id);

-- Política para criar instâncias
CREATE POLICY "Users can create their own instances"
  ON instances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para atualizar instâncias
CREATE POLICY "Users can update their own instances"
  ON instances FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para deletar instâncias
CREATE POLICY "Users can delete their own instances"
  ON instances FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGER PARA UPDATED_AT
-- ============================================================================

-- Criar função se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS update_instances_updated_at ON instances;
CREATE TRIGGER update_instances_updated_at
  BEFORE UPDATE ON instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNÇÃO PARA INSERIR INSTÂNCIAS DE TESTE
-- ============================================================================

CREATE OR REPLACE FUNCTION insert_test_instances(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Inserir instâncias de teste apenas se não existirem
  INSERT INTO instances (
    instanceName,
    instanceId,
    status,
    owner,
    profileName,
    user_id,
    integration,
    connected_at
  ) VALUES
    (
      'instance_test_1',
      'test-instance-1-id',
      'open',
      p_user_id::text || '@s.whatsapp.net',
      'Instância de Teste 1',
      p_user_id,
      'WHATSAPP-BAILEYS',
      NOW()
    ),
    (
      'instance_test_2',
      'test-instance-2-id',
      'open',
      p_user_id::text || '@s.whatsapp.net',
      'Instância de Teste 2',
      p_user_id,
      'WHATSAPP-BAILEYS',
      NOW()
    ),
    (
      'instance_test_3',
      'test-instance-3-id',
      'close',
      p_user_id::text || '@s.whatsapp.net',
      'Instância de Teste 3 (Desconectada)',
      p_user_id,
      'WHATSAPP-BAILEYS',
      NULL
    )
  ON CONFLICT (instanceName, user_id) DO NOTHING;
  
  RAISE NOTICE 'Instâncias de teste inseridas para o usuário %', p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE instances IS 'Armazena as instâncias do Evolution API conectadas pelos usuários';
COMMENT ON COLUMN instances.instanceName IS 'Nome único da instância';
COMMENT ON COLUMN instances.status IS 'Status da conexão: open, close, connecting';
COMMENT ON COLUMN instances.owner IS 'Número do WhatsApp do proprietário';
COMMENT ON COLUMN instances.profileName IS 'Nome do perfil do WhatsApp';
COMMENT ON COLUMN instances.integration IS 'Tipo de integração: WHATSAPP-BAILEYS, WHATSAPP-BUSINESS';

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- Para inserir instâncias de teste para o seu usuário, execute:
-- SELECT insert_test_instances('seu-user-id-aqui');

-- Exemplo:
-- 1. Obtenha seu user_id:
--    SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com';
--
-- 2. Insira as instâncias de teste:
--    SELECT insert_test_instances('user-id-obtido-acima');
--
-- 3. Verifique as instâncias:
--    SELECT * FROM instances WHERE user_id = 'seu-user-id';

-- ============================================================================
-- EXEMPLO DE QUERY PARA LISTAR INSTÂNCIAS ATIVAS
-- ============================================================================

-- SELECT 
--   instanceName,
--   status,
--   profileName,
--   connected_at,
--   created_at
-- FROM instances
-- WHERE user_id = auth.uid()
--   AND status = 'open'
-- ORDER BY connected_at DESC;

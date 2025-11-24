# Guia Rápido - Configurar Instâncias para Testes

## Problema

A listagem de instâncias não está aparecendo no modal de envio de mensagens porque:
1. A tabela `instances` pode não existir
2. A tabela pode estar vazia
3. Não há instâncias com status `'open'`

## Solução

### Passo 1: Criar a Tabela de Instâncias

Execute o arquivo SQL no Supabase SQL Editor:

```sql
-- Copie e cole todo o conteúdo de:
/migrations/create_instances_table.sql
```

Ou execute diretamente no Supabase Dashboard:
1. Vá para **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo do arquivo
4. Clique em **Run**

### Passo 2: Obter seu User ID

No Supabase SQL Editor, execute:

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email real
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';
```

Copie o `id` retornado.

### Passo 3: Inserir Instâncias de Teste

No Supabase SQL Editor, execute:

```sql
-- Substitua 'SEU-USER-ID-AQUI' pelo ID obtido no passo 2
SELECT insert_test_instances('SEU-USER-ID-AQUI');
```

Exemplo:
```sql
SELECT insert_test_instances('550e8400-e29b-41d4-a716-446655440000');
```

Isso criará 3 instâncias de teste:
- ✅ **instance_test_1** - Status: `open` (conectada)
- ✅ **instance_test_2** - Status: `open` (conectada)
- ❌ **instance_test_3** - Status: `close` (desconectada)

### Passo 4: Verificar as Instâncias

```sql
-- Verificar todas as instâncias
SELECT 
  instanceName,
  status,
  profileName,
  connected_at,
  created_at
FROM instances
WHERE user_id = 'SEU-USER-ID-AQUI'
ORDER BY created_at DESC;

-- Verificar apenas instâncias conectadas (as que aparecem no select)
SELECT 
  instanceName,
  status,
  profileName
FROM instances
WHERE user_id = 'SEU-USER-ID-AQUI'
  AND status = 'open';
```

### Passo 5: Testar na Aplicação

1. Recarregue a página de Messages
2. Clique em "Enviar" em qualquer template
3. No modal, clique no select de "Instância"
4. Você deve ver as 2 instâncias de teste com status `'open'`

---

## Estrutura da Tabela `instances`

```sql
CREATE TABLE instances (
  id UUID PRIMARY KEY,
  instanceName TEXT NOT NULL,        -- Nome da instância
  instanceId TEXT,                   -- ID da instância
  status TEXT NOT NULL,              -- 'open', 'close', 'connecting'
  owner TEXT,                        -- Número do WhatsApp
  profileName TEXT,                  -- Nome do perfil
  profilePictureUrl TEXT,            -- URL da foto de perfil
  user_id UUID NOT NULL,             -- ID do usuário (FK)
  qrcode TEXT,                       -- QR Code para conexão
  integration TEXT,                  -- Tipo de integração
  webhook_url TEXT,                  -- URL do webhook
  webhook_events TEXT[],             -- Eventos do webhook
  created_at TIMESTAMP,              -- Data de criação
  updated_at TIMESTAMP,              -- Última atualização
  connected_at TIMESTAMP,            -- Data de conexão
  disconnected_at TIMESTAMP          -- Data de desconexão
);
```

---

## Inserir Instância Manualmente

Se preferir inserir uma instância específica:

```sql
INSERT INTO instances (
  instanceName,
  instanceId,
  status,
  profileName,
  user_id,
  integration,
  connected_at
) VALUES (
  'minha_instancia',                    -- Nome da instância
  'minha-instancia-id',                 -- ID único
  'open',                               -- Status: open/close
  'Minha Instância WhatsApp',           -- Nome do perfil
  'SEU-USER-ID-AQUI',                   -- Seu user_id
  'WHATSAPP-BAILEYS',                   -- Tipo de integração
  NOW()                                 -- Data de conexão
);
```

---

## Atualizar Status de uma Instância

```sql
-- Conectar uma instância
UPDATE instances
SET 
  status = 'open',
  connected_at = NOW(),
  disconnected_at = NULL
WHERE instanceName = 'instance_test_3'
  AND user_id = 'SEU-USER-ID-AQUI';

-- Desconectar uma instância
UPDATE instances
SET 
  status = 'close',
  disconnected_at = NOW()
WHERE instanceName = 'instance_test_1'
  AND user_id = 'SEU-USER-ID-AQUI';
```

---

## Deletar Instâncias de Teste

```sql
-- Deletar todas as instâncias de teste
DELETE FROM instances
WHERE instanceName LIKE 'instance_test_%'
  AND user_id = 'SEU-USER-ID-AQUI';

-- Deletar uma instância específica
DELETE FROM instances
WHERE instanceName = 'instance_test_1'
  AND user_id = 'SEU-USER-ID-AQUI';
```

---

## Troubleshooting

### Erro: "relation 'instances' does not exist"

**Solução:** Execute a migração `create_instances_table.sql`

### Erro: "permission denied for table instances"

**Solução:** Verifique se as políticas RLS foram criadas:

```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'instances';

-- Se não existirem, execute novamente a migração
```

### Select de instâncias vazio

**Possíveis causas:**

1. **Nenhuma instância criada**
   ```sql
   -- Verificar
   SELECT COUNT(*) FROM instances WHERE user_id = 'SEU-USER-ID-AQUI';
   ```
   **Solução:** Execute `SELECT insert_test_instances('SEU-USER-ID-AQUI');`

2. **Todas as instâncias estão desconectadas**
   ```sql
   -- Verificar
   SELECT status, COUNT(*) 
   FROM instances 
   WHERE user_id = 'SEU-USER-ID-AQUI'
   GROUP BY status;
   ```
   **Solução:** Atualize o status para 'open':
   ```sql
   UPDATE instances
   SET status = 'open', connected_at = NOW()
   WHERE user_id = 'SEU-USER-ID-AQUI';
   ```

3. **User ID incorreto**
   ```sql
   -- Verificar user_id atual
   SELECT auth.uid();
   
   -- Verificar email do usuário
   SELECT id, email FROM auth.users WHERE id = auth.uid();
   ```

### Instâncias não aparecem na aplicação

1. **Limpe o cache do navegador** (Ctrl + Shift + R)
2. **Verifique o console do navegador** (F12) para erros
3. **Verifique se está logado** com o usuário correto
4. **Execute no console do navegador:**
   ```javascript
   // Verificar user_id
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User ID:', user.id);
   
   // Verificar instâncias
   const { data, error } = await supabase
     .from('instances')
     .select('*')
     .eq('user_id', user.id);
   console.log('Instances:', data, 'Error:', error);
   ```

---

## Integração com Evolution API Real

Quando você conectar instâncias reais da Evolution API, elas devem ser salvas na tabela `instances` com os seguintes dados:

```typescript
// Exemplo de como salvar uma instância real
const saveInstance = async (instanceData) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('instances')
    .upsert({
      instanceName: instanceData.instance.instanceName,
      instanceId: instanceData.instance.instanceId,
      status: instanceData.instance.status,
      owner: instanceData.instance.owner,
      profileName: instanceData.instance.profileName,
      profilePictureUrl: instanceData.instance.profilePictureUrl,
      user_id: user.id,
      integration: instanceData.instance.integration || 'WHATSAPP-BAILEYS',
      connected_at: instanceData.instance.status === 'open' ? new Date() : null
    }, {
      onConflict: 'instanceName,user_id'
    });
    
  return data;
};
```

---

## Comandos Úteis

```sql
-- Contar instâncias por status
SELECT status, COUNT(*) as total
FROM instances
WHERE user_id = 'SEU-USER-ID-AQUI'
GROUP BY status;

-- Listar instâncias conectadas recentemente
SELECT 
  instanceName,
  profileName,
  connected_at,
  EXTRACT(EPOCH FROM (NOW() - connected_at))/3600 as hours_connected
FROM instances
WHERE user_id = 'SEU-USER-ID-AQUI'
  AND status = 'open'
ORDER BY connected_at DESC;

-- Resetar todas as instâncias para teste
UPDATE instances
SET status = 'open', connected_at = NOW()
WHERE user_id = 'SEU-USER-ID-AQUI';
```

---

## Próximos Passos

Após configurar as instâncias de teste:

1. ✅ Teste o envio de mensagens
2. ✅ Teste a seleção de participantes
3. ✅ Teste a seleção de grupos
4. ✅ Conecte instâncias reais da Evolution API
5. ✅ Configure webhooks para sincronização automática

---

## Suporte

Se continuar com problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase SQL Editor
3. Confirme que todas as migrações foram executadas
4. Confirme que está usando o user_id correto

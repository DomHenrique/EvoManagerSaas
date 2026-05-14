# 🧪 Testando a Listagem de Instâncias

## Visão Geral

Este guia mostra como **testar e verificar** a funcionalidade de listagem de instâncias usando os **arquivos de teste** criados especificamente para isso.

> ⚠️ **IMPORTANTE**: Os arquivos de teste são **SOMENTE PARA TESTES**. Eles nunca devem ser usados como código principal da aplicação.

---

## 📁 Arquivos de Teste Disponíveis

### 1. `test-instance-listing-browser.ts`
**Uso**: Teste completo no navegador (requer login)

**Como usar**:
1. Abra a aplicação no navegador
2. Faça login com sua conta
3. Abra o console do navegador (F12)
4. Execute no console:
   ```javascript
   // Importar o módulo de teste
   import('./test-instance-listing-browser.js').then(module => {
     window.testInstanceListing = module.testInstanceListing;
     window.viewInstances = module.viewInstances;
     window.insertTestInstances = module.insertTestInstances;
     window.clearTestInstances = module.clearTestInstances;
   });
   
   // Depois, execute:
   testInstanceListing()
   ```

**Comandos disponíveis**:
- `testInstanceListing()` - Executa teste completo
- `viewInstances()` - Visualiza todas as instâncias
- `insertTestInstances()` - Insere dados de teste
- `clearTestInstances()` - Remove dados de teste

### 2. `test-instance-service.ts`
**Uso**: Teste das funções do instanceService

**Como usar**:
```bash
npx tsx test-instance-service.ts
```

> ⚠️ Requer autenticação - execute após fazer login na aplicação

### 3. `test-instance-listing.ts`
**Uso**: Teste abrangente de todas as funcionalidades

**Como usar**:
```bash
npx tsx test-instance-listing.ts
```

---

## 🔍 Método Recomendado: Teste no Navegador

### Passo 1: Preparar o Banco de Dados

Execute no **Supabase SQL Editor**:

```sql
-- 1. Obter seu user_id
SELECT id, email FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- 2. Inserir instâncias de teste (substitua SEU-USER-ID)
SELECT insert_test_instances('SEU-USER-ID-AQUI');

-- 3. Verificar as instâncias criadas
SELECT 
  instanceName,
  status,
  profileName,
  created_at
FROM instances
WHERE user_id = 'SEU-USER-ID-AQUI'
ORDER BY created_at DESC;
```

### Passo 2: Verificar no Navegador

1. **Abra a aplicação** e faça login
2. **Navegue até a página de Instances** (`/instances`)
3. **Verifique se as instâncias aparecem**:
   - ✅ `instance_test_1` - Status: Connected (verde)
   - ✅ `instance_test_2` - Status: Connected (verde)
   - ❌ `instance_test_3` - Status: Disconnected (vermelho)

### Passo 3: Testar via Console do Navegador

Abra o console (F12) e execute:

```javascript
// Verificar autenticação
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user.email, 'ID:', user.id);

// Buscar instâncias diretamente do banco
const { data: dbInstances, error } = await supabase
  .from('instances')
  .select('*')
  .eq('user_id', user.id);

console.log('Instances from DB:', dbInstances);
console.log('Error:', error);

// Buscar via instanceService
import { getInstances } from './services/instanceService';
const serviceInstances = await getInstances(user.id);
console.log('Instances from Service:', serviceInstances);
```

---

## ✅ Checklist de Verificação

### 1. Banco de Dados
- [ ] Tabela `instances` existe
- [ ] Políticas RLS estão ativas
- [ ] Função `insert_test_instances` existe
- [ ] Instâncias de teste foram inseridas
- [ ] Pelo menos 2 instâncias com status `'open'`

### 2. Serviço (instanceService.ts)
- [ ] `getInstances()` retorna array de instâncias
- [ ] `saveInstance()` salva corretamente
- [ ] `deleteInstance()` remove corretamente
- [ ] `syncInstancesFromAPI()` sincroniza com API

### 3. Interface (Instances.tsx)
- [ ] Página carrega sem erros
- [ ] Instâncias aparecem na listagem
- [ ] Status é exibido corretamente (Connected/Disconnected)
- [ ] Botões de ação funcionam (Connect, Disconnect, Delete)
- [ ] Modal de criação abre e fecha
- [ ] Criação de nova instância funciona

### 4. Sincronização
- [ ] Sync inicial executa ao carregar a página
- [ ] Sync periódico está ativo (a cada 60s)
- [ ] Logs aparecem no console do navegador
- [ ] Status das instâncias atualiza automaticamente

---

## 🐛 Troubleshooting

### Problema: "No instances yet" aparece mesmo com dados no banco

**Diagnóstico**:
```javascript
// No console do navegador
const { data: { user } } = await supabase.auth.getUser();
console.log('User ID:', user.id);

const { data, error } = await supabase
  .from('instances')
  .select('*')
  .eq('user_id', user.id);

console.log('DB Query Result:', { data, error });
```

**Possíveis causas**:
1. **User ID incorreto** - Verifique se o user_id das instâncias corresponde ao usuário logado
2. **RLS bloqueando** - Verifique as políticas RLS
3. **Erro na query** - Verifique o erro retornado

**Solução**:
```sql
-- Verificar user_id correto
SELECT auth.uid();

-- Atualizar user_id das instâncias de teste
UPDATE instances
SET user_id = auth.uid()
WHERE instanceName LIKE 'instance_test_%';
```

### Problema: Erro "PGRST116" no console

**Causa**: Nenhuma instância encontrada (não é um erro crítico)

**Solução**: Insira instâncias de teste:
```sql
SELECT insert_test_instances(auth.uid());
```

### Problema: Sync falha com erro de autenticação

**Causa**: Evolution API não está acessível ou credenciais incorretas

**Solução**:
1. Verifique o arquivo `.env`:
   ```env
   VITE_EVOLUTION_API_URL=https://sua-api.com
   VITE_EVOLUTION_API_KEY=sua-chave-aqui
   ```
2. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

### Problema: Instâncias não atualizam automaticamente

**Diagnóstico**:
```javascript
// Verificar se sync está ativo
import { isSyncActive } from './services/instanceService';
console.log('Sync active:', isSyncActive());
```

**Solução**: Recarregue a página de Instances

---

## 📊 Logs Esperados

### Console do Navegador (Normal)

```
[InstanceService] SyncManager - Starting periodic sync every 60000ms for user abc123...
[InstanceService] syncInstancesFromAPI - Starting sync from Evolution API for user: abc123
[InstanceService] syncInstancesFromAPI - API returned 0 instances
[InstanceService] getInstances - Fetching instances for user: abc123
[InstanceService] getInstances - Found 3 instances
```

### Console do Navegador (Com Erros)

```
❌ [InstanceService] syncInstancesFromAPI - Failed to fetch DB instances
   Error: { code: 'PGRST116', message: 'No rows found' }
```

> ℹ️ PGRST116 não é um erro crítico - apenas indica que não há instâncias no banco

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUXO DE INSTÂNCIAS                      │
└─────────────────────────────────────────────────────────────┘

1. CARREGAMENTO INICIAL
   ├─ Instances.tsx monta
   ├─ loadInstances() busca do banco via getInstances()
   ├─ syncInstancesFromAPI() sincroniza com Evolution API
   └─ loadInstances() atualiza a UI

2. SINCRONIZAÇÃO PERIÓDICA (a cada 60s)
   ├─ SyncManager executa syncInstancesFromAPI()
   ├─ Busca instâncias da Evolution API
   ├─ Compara com instâncias do banco
   ├─ Atualiza/Insere/Remove conforme necessário
   └─ Próxima execução em 60s

3. AÇÕES DO USUÁRIO
   ├─ Criar instância
   │  ├─ createInstanceAPI() → Evolution API
   │  ├─ saveInstance() → Banco de dados
   │  └─ loadInstances() → Atualiza UI
   │
   ├─ Conectar instância
   │  ├─ connectInstance() → Evolution API (retorna QR/pairing)
   │  ├─ Usuário escaneia QR
   │  ├─ Sync automático detecta mudança de status
   │  └─ UI atualiza para "Connected"
   │
   └─ Deletar instância
      ├─ deleteInstanceAPI() → Evolution API
      ├─ deleteInstanceDB() → Banco de dados
      └─ loadInstances() → Atualiza UI
```

---

## 📝 Exemplo de Teste Completo

```javascript
// ============================================
// TESTE COMPLETO - Execute no console do navegador
// ============================================

console.clear();
console.log('🧪 INICIANDO TESTE DE LISTAGEM DE INSTÂNCIAS\n');

// 1. Verificar autenticação
const { data: { user } } = await supabase.auth.getUser();
console.log('✅ Usuário:', user.email);

// 2. Inserir dados de teste
await supabase.rpc('insert_test_instances', { p_user_id: user.id });
console.log('✅ Dados de teste inseridos');

// 3. Buscar via banco de dados
const { data: dbData } = await supabase
  .from('instances')
  .select('*')
  .eq('user_id', user.id);
console.log('✅ Banco de dados:', dbData.length, 'instâncias');

// 4. Buscar via service
const { getInstances } = await import('./services/instanceService.js');
const serviceData = await getInstances(user.id);
console.log('✅ Service:', serviceData.length, 'instâncias');

// 5. Comparar resultados
console.log('\n📊 RESULTADO:');
console.table(serviceData.map(i => ({
  Nome: i.instanceName,
  Status: i.status,
  Perfil: i.profileName || 'N/A'
})));

console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
```

---

## 🎯 Conclusão

Para confirmar que a listagem de instâncias está funcionando:

1. ✅ Execute a migração SQL (`create_instances_table.sql`)
2. ✅ Insira dados de teste (`insert_test_instances`)
3. ✅ Verifique no navegador (página `/instances`)
4. ✅ Execute testes no console do navegador
5. ✅ Verifique os logs no console

**Lembre-se**: Os arquivos de teste são **SOMENTE PARA TESTES**. O código de produção está em:
- `services/instanceService.ts` - Lógica de negócio
- `pages/Instances.tsx` - Interface do usuário
- `migrations/create_instances_table.sql` - Estrutura do banco

---

## 📚 Referências

- [SETUP_INSTANCES.md](./SETUP_INSTANCES.md) - Guia de configuração
- [instanceService.ts](../services/instanceService.ts) - Código de produção
- [Instances.tsx](../pages/Instances.tsx) - Interface
- [create_instances_table.sql](../migrations/create_instances_table.sql) - Migração

# Atualizações da Página de Mensagens - Upload de Arquivos e Seleção de Destinatários

## 🎉 Novas Funcionalidades

### 1. Upload de Arquivos Locais para Mídia

Agora você pode fazer upload de arquivos diretamente do seu computador ao invés de usar apenas URLs!

#### Como Funciona:

**Ao criar um template de mídia:**
1. Selecione o tipo de mídia (Imagem, Vídeo, Áudio ou Documento)
2. Clique em "Escolher arquivo" para selecionar um arquivo do seu computador
3. **OU** digite uma URL se preferir usar um arquivo online
4. Adicione uma legenda opcional
5. Salve o template

**Tipos de arquivo suportados:**
- **Imagens**: JPG, PNG, GIF, WebP
- **Vídeos**: MP4, AVI, MOV, WebM
- **Áudios**: MP3, WAV, OGG, M4A
- **Documentos**: PDF, DOC, DOCX, XLS, XLSX, TXT

#### Armazenamento:

Os arquivos são armazenados no **Supabase Storage** no bucket `message-media`:

```
message-media/
  └── {user_id}/
      ├── 1703001234567.jpg
      ├── 1703001234568.mp4
      └── 1703001234569.pdf
```

**Características:**
- ✅ URLs públicas geradas automaticamente
- ✅ Organização por usuário
- ✅ Segurança com RLS (Row Level Security)
- ✅ Cada usuário só pode acessar seus próprios arquivos
- ✅ Suporte a arquivos de até 50MB (configurável)

---

### 2. Seleção de Destinatários Aprimorada

Agora você tem **3 formas** de escolher o destinatário ao enviar uma mensagem:

#### 📝 Manual
Digite o número manualmente (como antes):
- Formato: `código do país + DDD + número`
- Exemplo: `5511999999999`

#### 👤 Participante
Selecione de uma lista de participantes conhecidos:
- Lista carregada automaticamente do banco de dados
- Mostra participantes que já interagiram com você
- Ordenados por última interação
- Exibe nome ou número de telefone

#### 👥 Grupo
Selecione um grupo do WhatsApp:
- Lista carregada da Evolution API em tempo real
- Mostra nome do grupo e número de membros
- Apenas grupos da instância selecionada

---

### 3. Listagem Corrigida de Instâncias

A listagem de instâncias foi corrigida para mostrar apenas instâncias **ativas** (status: `open`):

```typescript
// Busca apenas instâncias conectadas
const { data, error } = await supabase
  .from('instances')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'open');  // ← Filtro por status
```

**Benefícios:**
- ✅ Evita tentar enviar por instâncias desconectadas
- ✅ Lista atualizada automaticamente
- ✅ Menos erros de envio

---

## 🔧 Configuração Necessária

### 1. Criar Bucket no Supabase

Execute o arquivo SQL no Supabase:

```bash
# No Supabase SQL Editor:
# Execute: /migrations/create_storage_bucket.sql
```

Ou manualmente no dashboard do Supabase:

1. Vá para **Storage** → **Create a new bucket**
2. Nome: `message-media`
3. Marque como **Public bucket**
4. Clique em **Create bucket**

### 2. Configurar Políticas de Segurança

As políticas RLS já estão incluídas na migração:

- ✅ Usuários podem fazer upload de seus próprios arquivos
- ✅ Todos podem visualizar arquivos (bucket público)
- ✅ Usuários podem deletar apenas seus próprios arquivos
- ✅ Usuários podem atualizar apenas seus próprios arquivos

### 3. Configurar Limites de Upload (Opcional)

No dashboard do Supabase:

1. Vá para **Storage** → **Policies**
2. Configure o tamanho máximo de arquivo
3. Padrão: 50MB (ajustável conforme necessidade)

---

## 📖 Guia de Uso

### Criar Template com Upload de Arquivo

```typescript
// Passo a passo:
1. Clique em "Novo Template"
2. Digite um nome (ex: "Promoção de Natal")
3. Selecione tipo: "Mídia"
4. Escolha o tipo de mídia: "Imagem"
5. Clique em "Escolher arquivo"
6. Selecione uma imagem do seu computador
7. Adicione uma legenda (opcional)
8. Clique em "Criar Template"

// O arquivo será:
// 1. Enviado para o Supabase Storage
// 2. URL pública gerada automaticamente
// 3. Salvo no template
```

### Enviar Mensagem para Participante

```typescript
// Passo a passo:
1. Clique em "Enviar" no template desejado
2. Selecione a instância
3. Escolha "Participante" como tipo de destinatário
4. Selecione o participante da lista
5. Clique em "Enviar"

// A lista de participantes é carregada de:
// - Tabela 'participants' no Supabase
// - Filtrada por instância selecionada
// - Ordenada por última interação
```

### Enviar Mensagem para Grupo

```typescript
// Passo a passo:
1. Clique em "Enviar" no template desejado
2. Selecione a instância
3. Escolha "Grupo" como tipo de destinatário
4. Aguarde o carregamento dos grupos
5. Selecione o grupo da lista
6. Clique em "Enviar"

// A lista de grupos é carregada de:
// - Evolution API via fetchGroups()
// - Apenas grupos da instância selecionada
// - Mostra nome e número de membros
```

---

## 🎨 Interface Atualizada

### Modal de Criação de Template

```
┌─────────────────────────────────────┐
│ Novo Template                    [X]│
├─────────────────────────────────────┤
│ Nome do Template:                   │
│ [Promoção de Natal            ]     │
│                                     │
│ Tipo de Mensagem:                   │
│ [Mídia                        ▼]    │
│                                     │
│ Tipo de Mídia:                      │
│ [Imagem                       ▼]    │
│                                     │
│ Upload de Arquivo:                  │
│ ┌─────────────────────────────┐    │
│ │  📤 Escolher arquivo         │    │
│ └─────────────────────────────┘    │
│ Ou use uma URL abaixo               │
│                                     │
│ URL da Mídia:                       │
│ [                             ]     │
│                                     │
│ Legenda (opcional):                 │
│ [Aproveite nossa promoção!    ]     │
│                                     │
├─────────────────────────────────────┤
│           [Cancelar] [Criar Template]│
└─────────────────────────────────────┘
```

### Modal de Envio

```
┌─────────────────────────────────────┐
│ Enviar Mensagem                  [X]│
├─────────────────────────────────────┤
│ Template:                           │
│ ┌─────────────────────────────────┐│
│ │ Promoção de Natal               ││
│ │ Mídia                           ││
│ └─────────────────────────────────┘│
│                                     │
│ Instância:                          │
│ [Minha Instância              ▼]    │
│                                     │
│ Tipo de Destinatário:               │
│ ┌────┐ ┌────────┐ ┌──────┐         │
│ │👤  │ │👤      │ │👥    │         │
│ │Man.│ │Partic. │ │Grupo │         │
│ └────┘ └────────┘ └──────┘         │
│                                     │
│ Participante:                       │
│ [João Silva - 5511999999999   ▼]   │
│                                     │
├─────────────────────────────────────┤
│              [Cancelar] [📤 Enviar] │
└─────────────────────────────────────┘
```

---

## 🔍 Detalhes Técnicos

### Upload de Arquivo

```typescript
const uploadMediaToSupabase = async (file: File): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Gera nome único com timestamp
  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
  
  // Upload para o Storage
  const { data, error } = await supabase.storage
    .from('message-media')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  // Gera URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('message-media')
    .getPublicUrl(data.path);

  return publicUrl;
};
```

### Carregamento de Grupos

```typescript
const loadGroupsAndParticipants = async (instanceName: string) => {
  setLoadingGroups(true);
  try {
    // Busca grupos da Evolution API
    const groupsData = await fetchGroups(instanceName, true);
    setGroups(groupsData);

    // Busca participantes do banco de dados
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: participantsData } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.id)
      .eq('instance_name', instanceName)
      .order('last_interaction_at', { ascending: false });

    setParticipants(participantsData || []);
  } catch (error) {
    console.error('Error loading groups and participants:', error);
  } finally {
    setLoadingGroups(false);
  }
};
```

### Seleção de Destinatário

```typescript
let finalRecipient = '';

if (recipientType === 'manual') {
  finalRecipient = recipient; // Número digitado
} else if (recipientType === 'participant') {
  finalRecipient = selectedParticipant; // Número do participante
} else if (recipientType === 'group') {
  finalRecipient = selectedGroup; // ID do grupo
}

// Envia mensagem com o destinatário correto
await sendTextMessage(instanceName, finalRecipient, text);
```

---

## 🐛 Troubleshooting

### Erro: "Failed to upload file"

**Possíveis causas:**
1. Bucket não foi criado
2. Políticas RLS não configuradas
3. Arquivo muito grande

**Solução:**
```sql
-- Verificar se bucket existe
SELECT * FROM storage.buckets WHERE id = 'message-media';

-- Verificar políticas
SELECT * FROM storage.policies WHERE bucket_id = 'message-media';

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-media', 'message-media', true);
```

### Grupos não aparecem

**Possíveis causas:**
1. Instância não está conectada
2. Instância não tem grupos
3. Erro na Evolution API

**Solução:**
```typescript
// Verificar status da instância
const { data } = await supabase
  .from('instances')
  .select('*')
  .eq('instanceName', 'sua-instancia')
  .single();

console.log('Status:', data.status); // Deve ser 'open'

// Testar API diretamente
const groups = await fetchGroups('sua-instancia', true);
console.log('Grupos:', groups);
```

### Participantes não aparecem

**Possíveis causas:**
1. Nenhum participante cadastrado
2. Participantes de outra instância
3. Tabela `participants` vazia

**Solução:**
```sql
-- Verificar participantes
SELECT * FROM participants 
WHERE instance_name = 'sua-instancia'
ORDER BY last_interaction_at DESC;

-- Criar participante manualmente para teste
INSERT INTO participants (
  phone_number,
  name,
  instance_name,
  user_id
) VALUES (
  '5511999999999',
  'Teste',
  'sua-instancia',
  'seu-user-id'
);
```

---

## 📊 Benefícios das Melhorias

### Upload de Arquivos:
- ✅ Mais conveniente que URLs
- ✅ Controle total sobre os arquivos
- ✅ Não depende de serviços externos
- ✅ URLs permanentes e confiáveis
- ✅ Organização automática por usuário

### Seleção de Destinatários:
- ✅ Menos erros de digitação
- ✅ Acesso rápido a contatos frequentes
- ✅ Envio para grupos facilitado
- ✅ Interface mais intuitiva
- ✅ Histórico de interações

### Listagem de Instâncias:
- ✅ Apenas instâncias funcionais
- ✅ Menos tentativas de envio falhadas
- ✅ Melhor experiência do usuário
- ✅ Feedback mais claro

---

## 🚀 Próximas Melhorias Sugeridas

- [ ] Preview de imagens antes do upload
- [ ] Compressão automática de imagens
- [ ] Upload múltiplo de arquivos
- [ ] Drag & drop para upload
- [ ] Busca de participantes por nome
- [ ] Filtros para grupos (tamanho, atividade)
- [ ] Envio em massa para múltiplos destinatários
- [ ] Agendamento de mensagens
- [ ] Tags para organizar participantes
- [ ] Importação de contatos via CSV

---

## 📝 Changelog

### Versão 1.1.0 (2025-01-23)

**Adicionado:**
- ✅ Upload de arquivos locais para templates de mídia
- ✅ Seleção de participantes do banco de dados
- ✅ Seleção de grupos da Evolution API
- ✅ Três tipos de destinatários (Manual, Participante, Grupo)
- ✅ Bucket no Supabase Storage para mídias
- ✅ Políticas RLS para segurança de arquivos
- ✅ Loading states para carregamento de grupos
- ✅ Validação de arquivo antes do upload
- ✅ Limpeza de arquivo selecionado

**Corrigido:**
- ✅ Listagem de instâncias agora filtra por status 'open'
- ✅ Carregamento de grupos apenas quando necessário
- ✅ Validação de destinatário antes do envio

**Melhorado:**
- ✅ Interface do modal de envio
- ✅ Feedback visual durante upload
- ✅ Organização do código
- ✅ Tratamento de erros
- ✅ Acessibilidade (aria-labels)

---

## 📚 Recursos Adicionais

- [Documentação Supabase Storage](https://supabase.com/docs/guides/storage)
- [Evolution API - Grupos](https://doc.evolution-api.com/groups)
- [Evolution API - Mensagens](https://doc.evolution-api.com/messages)

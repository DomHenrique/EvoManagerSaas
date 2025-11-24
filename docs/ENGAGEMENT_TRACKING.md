# Sistema de Rastreamento de Engajamento de Participantes

## Visão Geral

O sistema de rastreamento de engajamento permite monitorar e analisar como os participantes (contatos) interagem com suas mensagens, especialmente com botões interativos. Este sistema fornece insights valiosos sobre o comportamento dos usuários e a eficácia de suas campanhas de mensagens.

## Estrutura do Banco de Dados

### 1. Tabela: `participants`

Armazena informações sobre todos os contatos que recebem mensagens.

#### Campos Principais:
- **Identificação**
  - `phone_number`: Número de telefone (formato internacional)
  - `name`: Nome do contato (opcional, pode ser definido manualmente)
  - `whatsapp_name`: Nome do perfil do WhatsApp
  - `profile_picture_url`: URL da foto de perfil

- **Categorização**
  - `tags`: Array de tags para organização (ex: ['cliente', 'vip', 'suporte'])
  - `notes`: Notas sobre o participante
  - `custom_fields`: Campos personalizados em JSON

- **Estatísticas**
  - `total_messages_sent`: Total de mensagens enviadas para este contato
  - `total_messages_received`: Total de mensagens recebidas deste contato
  - `last_interaction_at`: Data da última interação
  - `first_contact_at`: Data do primeiro contato

- **Controle**
  - `is_blocked`: Se o contato está bloqueado
  - `blocked_reason`: Motivo do bloqueio

#### Exemplo de Uso:
```sql
-- Buscar participantes mais ativos
SELECT * FROM participants
WHERE last_interaction_at > NOW() - INTERVAL '7 days'
ORDER BY total_messages_sent DESC
LIMIT 10;

-- Buscar participantes por tag
SELECT * FROM participants
WHERE 'vip' = ANY(tags)
ORDER BY last_interaction_at DESC;
```

### 2. Tabela: `button_engagements`

Registra cada clique em botões de mensagens interativas.

#### Campos Principais:
- **Referências**
  - `participant_id`: Referência ao participante
  - `template_id`: Template usado
  - `message_send_history_id`: Histórico de envio relacionado

- **Informações do Botão**
  - `button_id`: ID do botão (ex: 'btn_1', 'row_1')
  - `button_text`: Texto do botão clicado
  - `button_type`: Tipo do botão ('quick_reply', 'list_item', 'call_to_action')
  - `button_position`: Posição do botão (1, 2, 3...)

- **Métricas**
  - `response_time_seconds`: Tempo entre envio e clique (calculado automaticamente)
  - `clicked_at`: Timestamp do clique
  - `message_sent_at`: Timestamp do envio da mensagem

#### Exemplo de Uso:
```sql
-- Botões mais clicados
SELECT 
  button_text,
  COUNT(*) as total_clicks,
  AVG(response_time_seconds) as avg_response_time
FROM button_engagements
WHERE template_id = 'seu-template-id'
GROUP BY button_text
ORDER BY total_clicks DESC;

-- Engajamento nas últimas 24 horas
SELECT COUNT(*) as clicks_today
FROM button_engagements
WHERE clicked_at > NOW() - INTERVAL '24 hours';
```

### 3. Tabela: `participant_responses`

Armazena respostas textuais dos participantes após interações.

#### Campos Principais:
- **Resposta**
  - `response_text`: Texto da resposta
  - `response_type`: Tipo ('text', 'media', 'voice', 'document')
  - `media_url`: URL da mídia (se aplicável)

- **Contexto**
  - `is_reply_to_button`: Se é resposta após clicar em botão
  - `button_engagement_id`: Referência ao clique do botão

- **Análise de Sentimento** (opcional)
  - `sentiment`: 'positive', 'negative', 'neutral'
  - `sentiment_score`: Score de -1.00 a 1.00

#### Exemplo de Uso:
```sql
-- Respostas após cliques em botões
SELECT 
  pr.response_text,
  be.button_text,
  pr.received_at
FROM participant_responses pr
JOIN button_engagements be ON pr.button_engagement_id = be.id
WHERE pr.is_reply_to_button = true
ORDER BY pr.received_at DESC;
```

### 4. Tabela: `template_engagement_metrics`

Métricas agregadas por template e período.

#### Campos Principais:
- **Período**
  - `period_start`: Início do período
  - `period_end`: Fim do período
  - `period_type`: 'daily', 'weekly', 'monthly'

- **Métricas de Envio**
  - `total_sent`: Total enviado
  - `total_delivered`: Total entregue
  - `total_read`: Total lido
  - `total_failed`: Total falhado

- **Métricas de Engajamento**
  - `total_button_clicks`: Total de cliques
  - `unique_participants_engaged`: Participantes únicos que clicaram
  - `engagement_rate`: Taxa de engajamento (%)
  - `average_response_time_seconds`: Tempo médio de resposta

- **Métricas por Botão**
  - `button_metrics`: JSON com métricas detalhadas por botão

#### Exemplo de Uso:
```sql
-- Performance do template no último mês
SELECT 
  period_start,
  total_sent,
  total_button_clicks,
  engagement_rate,
  average_response_time_seconds
FROM template_engagement_metrics
WHERE template_id = 'seu-template-id'
  AND period_type = 'daily'
  AND period_start >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY period_start DESC;
```

### 5. Tabela: `conversation_sessions`

Agrupa interações em sessões de conversa.

#### Campos Principais:
- **Sessão**
  - `session_id`: ID único da sessão
  - `status`: 'active', 'completed', 'abandoned'
  - `duration_seconds`: Duração da sessão

- **Métricas**
  - `total_messages_sent`: Mensagens enviadas na sessão
  - `total_messages_received`: Mensagens recebidas na sessão
  - `total_button_clicks`: Cliques na sessão
  - `templates_used`: Array de templates usados

#### Exemplo de Uso:
```sql
-- Sessões ativas
SELECT * FROM conversation_sessions
WHERE status = 'active'
ORDER BY last_activity_at DESC;

-- Duração média das sessões
SELECT AVG(duration_seconds) as avg_duration
FROM conversation_sessions
WHERE status = 'completed';
```

## Views Analíticas

### 1. `v_top_engaged_participants`

Participantes mais engajados ordenados por atividade.

```sql
SELECT * FROM v_top_engaged_participants
LIMIT 20;
```

### 2. `v_template_performance`

Performance de cada template com taxa de engajamento.

```sql
SELECT * FROM v_template_performance
WHERE engagement_rate_percent > 50
ORDER BY engagement_rate_percent DESC;
```

### 3. `v_button_engagement_analysis`

Análise detalhada de cliques por botão.

```sql
SELECT * FROM v_button_engagement_analysis
WHERE template_id = 'seu-template-id'
ORDER BY total_clicks DESC;
```

### 4. `v_recent_activity`

Atividade recente (últimos 100 eventos).

```sql
SELECT * FROM v_recent_activity
WHERE activity_at > NOW() - INTERVAL '1 hour';
```

## Triggers Automáticos

### 1. Atualização de Estatísticas de Participantes

Quando uma mensagem é enviada com sucesso, as estatísticas do participante são atualizadas automaticamente:

```sql
-- Executado automaticamente após INSERT em message_send_history
-- Atualiza: total_messages_sent, last_interaction_at
-- Cria participante se não existir
```

### 2. Cálculo de Tempo de Resposta

Quando um engajamento é registrado, o tempo de resposta é calculado automaticamente:

```sql
-- Executado automaticamente antes de INSERT em button_engagements
-- Calcula: response_time_seconds = clicked_at - message_sent_at
```

### 3. Atualização de Métricas de Template

Quando um botão é clicado, as métricas diárias do template são atualizadas:

```sql
-- Executado automaticamente após INSERT em button_engagements
-- Atualiza ou cria registro em template_engagement_metrics
```

## Integração com Webhooks

### Recebendo Cliques de Botões

Para rastrear cliques de botões, você precisa configurar webhooks na Evolution API:

#### 1. Configurar Webhook

```typescript
// Endpoint do webhook: https://seu-dominio.com/api/webhooks/evolution

interface WebhookPayload {
  event: 'messages.upsert';
  instance: string;
  data: {
    key: {
      remoteJid: string; // número do telefone
    };
    message: {
      buttonsResponseMessage?: {
        selectedButtonId: string;
        selectedDisplayText: string;
      };
      listResponseMessage?: {
        singleSelectReply: {
          selectedRowId: string;
        };
      };
    };
    messageTimestamp: number;
  };
}
```

#### 2. Processar Webhook

```typescript
async function processButtonClick(payload: WebhookPayload) {
  const phoneNumber = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');
  
  // Extrair informações do botão
  let buttonId, buttonText;
  
  if (payload.data.message.buttonsResponseMessage) {
    buttonId = payload.data.message.buttonsResponseMessage.selectedButtonId;
    buttonText = payload.data.message.buttonsResponseMessage.selectedDisplayText;
  } else if (payload.data.message.listResponseMessage) {
    buttonId = payload.data.message.listResponseMessage.singleSelectReply.selectedRowId;
    buttonText = payload.data.message.listResponseMessage.title;
  }
  
  // Buscar participante
  const participant = await supabase
    .from('participants')
    .select('*')
    .eq('phone_number', phoneNumber)
    .eq('instance_name', payload.instance)
    .single();
  
  // Registrar engajamento
  await supabase
    .from('button_engagements')
    .insert({
      participant_id: participant.data?.id,
      phone_number: phoneNumber,
      instance_name: payload.instance,
      button_id: buttonId,
      button_text: buttonText,
      clicked_at: new Date(payload.data.messageTimestamp * 1000).toISOString(),
      user_id: participant.data?.user_id
    });
}
```

## Casos de Uso

### 1. Dashboard de Engajamento

```typescript
// Buscar estatísticas gerais
const { data: stats } = await supabase
  .from('v_top_engaged_participants')
  .select('*')
  .limit(10);

const { data: performance } = await supabase
  .from('v_template_performance')
  .select('*')
  .order('engagement_rate_percent', { ascending: false });
```

### 2. Análise de Template Específico

```typescript
// Buscar performance de um template
const { data: metrics } = await supabase
  .from('template_engagement_metrics')
  .select('*')
  .eq('template_id', templateId)
  .eq('period_type', 'daily')
  .gte('period_start', thirtyDaysAgo)
  .order('period_start', { ascending: false });

// Buscar análise de botões
const { data: buttonAnalysis } = await supabase
  .from('v_button_engagement_analysis')
  .select('*')
  .eq('template_id', templateId);
```

### 3. Perfil de Participante

```typescript
// Buscar participante
const { data: participant } = await supabase
  .from('participants')
  .select('*')
  .eq('phone_number', phoneNumber)
  .single();

// Buscar engajamentos
const { data: engagements } = await supabase
  .from('button_engagements')
  .select('*')
  .eq('participant_id', participant.id)
  .order('clicked_at', { ascending: false });

// Buscar respostas
const { data: responses } = await supabase
  .from('participant_responses')
  .select('*')
  .eq('participant_id', participant.id)
  .order('received_at', { ascending: false });
```

### 4. Segmentação de Participantes

```typescript
// Participantes altamente engajados (clicaram 5+ vezes)
const { data: highlyEngaged } = await supabase
  .from('v_top_engaged_participants')
  .select('*')
  .gte('total_button_clicks', 5);

// Participantes inativos (sem interação há 30 dias)
const { data: inactive } = await supabase
  .from('participants')
  .select('*')
  .lt('last_interaction_at', thirtyDaysAgo);

// Participantes com tag específica
const { data: vipParticipants } = await supabase
  .from('participants')
  .select('*')
  .contains('tags', ['vip']);
```

## Métricas e KPIs

### Taxa de Engajamento

```sql
-- Taxa de engajamento por template
SELECT 
  template_id,
  template_name,
  ROUND(
    (unique_participants_engaged::DECIMAL / NULLIF(total_sent, 0) * 100), 
    2
  ) as engagement_rate
FROM template_engagement_metrics
WHERE period_type = 'daily'
  AND period_start = CURRENT_DATE;
```

### Tempo Médio de Resposta

```sql
-- Tempo médio de resposta por template
SELECT 
  template_name,
  AVG(response_time_seconds) as avg_response_time,
  MIN(response_time_seconds) as fastest_response,
  MAX(response_time_seconds) as slowest_response
FROM button_engagements
WHERE clicked_at > NOW() - INTERVAL '7 days'
GROUP BY template_name;
```

### Botões Mais Populares

```sql
-- Top 10 botões mais clicados
SELECT 
  button_text,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT participant_id) as unique_clickers
FROM button_engagements
WHERE clicked_at > NOW() - INTERVAL '30 days'
GROUP BY button_text
ORDER BY total_clicks DESC
LIMIT 10;
```

## Boas Práticas

### 1. Limpeza de Dados

```sql
-- Arquivar dados antigos (> 1 ano)
-- Executar mensalmente
DELETE FROM button_engagements
WHERE clicked_at < NOW() - INTERVAL '1 year';

DELETE FROM participant_responses
WHERE received_at < NOW() - INTERVAL '1 year';
```

### 2. Otimização de Queries

```sql
-- Usar índices apropriados
-- Já criados na migração:
-- - idx_button_engagements_clicked_at
-- - idx_participants_last_interaction
-- - idx_button_engagements_template_id
```

### 3. Monitoramento

```sql
-- Verificar participantes sem engajamento
SELECT COUNT(*) as participants_without_engagement
FROM participants p
LEFT JOIN button_engagements be ON p.id = be.participant_id
WHERE be.id IS NULL;

-- Verificar templates sem engajamento
SELECT COUNT(*) as templates_without_engagement
FROM message_templates mt
LEFT JOIN button_engagements be ON mt.id = be.template_id
WHERE be.id IS NULL
  AND mt.sent_count > 0;
```

## Próximas Funcionalidades

- [ ] Análise de sentimento automática usando IA
- [ ] Segmentação automática baseada em comportamento
- [ ] Alertas para participantes inativos
- [ ] Exportação de relatórios em PDF/Excel
- [ ] Integração com ferramentas de CRM
- [ ] Previsão de engajamento usando ML
- [ ] A/B testing de templates
- [ ] Funis de conversão

## Troubleshooting

### Participante não está sendo criado automaticamente

Verifique se o trigger está ativo:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'update_participant_stats_on_send';
```

### Métricas não estão sendo atualizadas

Verifique se os triggers estão funcionando:
```sql
-- Testar manualmente
SELECT update_template_engagement_metrics();
```

### Performance lenta em queries

Verifique se os índices estão sendo usados:
```sql
EXPLAIN ANALYZE
SELECT * FROM button_engagements
WHERE template_id = 'seu-template-id';
```

## Referências

- [Documentação Supabase](https://supabase.com/docs)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)
- [Evolution API Webhooks](https://doc.evolution-api.com/webhooks)

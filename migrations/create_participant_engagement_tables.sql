-- ============================================================================
-- TABELAS DE PARTICIPANTES E ENGAJAMENTO
-- ============================================================================

-- Tabela de Participantes/Contatos
-- Armazena informações sobre os contatos que recebem mensagens
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  instance_name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Metadados do WhatsApp
  whatsapp_name TEXT,
  is_business BOOLEAN DEFAULT false,
  business_description TEXT,
  
  -- Informações adicionais
  tags TEXT[], -- Tags para categorização (ex: ['cliente', 'vip', 'suporte'])
  notes TEXT, -- Notas sobre o participante
  custom_fields JSONB DEFAULT '{}', -- Campos personalizados
  
  -- Estatísticas
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Controle
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir unicidade por usuário e instância
  UNIQUE(phone_number, instance_name, user_id)
);

-- Tabela de Engajamento com Botões
-- Registra cada interação com botões de mensagens
CREATE TABLE IF NOT EXISTS button_engagements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  message_send_history_id UUID REFERENCES message_send_history(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações do participante (denormalizado para histórico)
  phone_number TEXT NOT NULL,
  participant_name TEXT,
  instance_name TEXT NOT NULL,
  
  -- Informações da mensagem
  template_name TEXT,
  template_type TEXT,
  message_content JSONB, -- Conteúdo completo da mensagem enviada
  
  -- Informações do botão clicado
  button_id TEXT NOT NULL, -- ID do botão (ex: 'btn_1', 'row_1')
  button_text TEXT NOT NULL, -- Texto do botão clicado
  button_type TEXT, -- Tipo: 'quick_reply', 'list_item', 'call_to_action'
  button_position INTEGER, -- Posição do botão (1, 2, 3...)
  
  -- Contexto da interação
  interaction_type TEXT DEFAULT 'button_click', -- 'button_click', 'list_selection'
  response_time_seconds INTEGER, -- Tempo entre envio e clique (em segundos)
  
  -- Metadados adicionais
  device_info JSONB, -- Informações do dispositivo (se disponível)
  location_data JSONB, -- Dados de localização (se disponível)
  session_id TEXT, -- ID da sessão de conversa
  
  -- Timestamps
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Respostas de Participantes
-- Armazena respostas textuais após interações com botões
CREATE TABLE IF NOT EXISTS participant_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  button_engagement_id UUID REFERENCES button_engagements(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações da resposta
  phone_number TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  response_text TEXT NOT NULL,
  response_type TEXT DEFAULT 'text', -- 'text', 'media', 'voice', 'document'
  media_url TEXT, -- URL da mídia (se aplicável)
  media_type TEXT, -- 'image', 'video', 'audio', 'document'
  
  -- Contexto
  is_reply_to_button BOOLEAN DEFAULT false,
  related_template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
  conversation_id TEXT, -- ID da conversa
  
  -- Análise de sentimento (pode ser preenchido posteriormente)
  sentiment TEXT, -- 'positive', 'negative', 'neutral'
  sentiment_score DECIMAL(3,2), -- -1.00 a 1.00
  
  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Métricas de Engajamento por Template
-- Agregação de métricas para análise rápida
CREATE TABLE IF NOT EXISTS template_engagement_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  template_id UUID NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Período de agregação
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  
  -- Métricas de envio
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  -- Métricas de engajamento
  total_button_clicks INTEGER DEFAULT 0,
  unique_participants_engaged INTEGER DEFAULT 0,
  total_responses_received INTEGER DEFAULT 0,
  
  -- Métricas por botão (JSONB para flexibilidade)
  button_metrics JSONB DEFAULT '{}', -- { "btn_1": { "clicks": 10, "text": "Sim" }, ... }
  
  -- Taxa de conversão
  engagement_rate DECIMAL(5,2), -- Percentual de pessoas que clicaram
  response_rate DECIMAL(5,2), -- Percentual de pessoas que responderam
  average_response_time_seconds INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint para garantir unicidade por template e período
  UNIQUE(template_id, period_start, period_end, period_type)
);

-- Tabela de Conversas/Sessões
-- Agrupa interações em conversas
CREATE TABLE IF NOT EXISTS conversation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referências
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações da sessão
  session_id TEXT NOT NULL UNIQUE,
  phone_number TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  
  -- Status da conversa
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
  
  -- Métricas da sessão
  total_messages_sent INTEGER DEFAULT 0,
  total_messages_received INTEGER DEFAULT 0,
  total_button_clicks INTEGER DEFAULT 0,
  
  -- Templates usados nesta sessão
  templates_used TEXT[], -- Array de IDs de templates
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Duração
  duration_seconds INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_phone_number ON participants(phone_number);
CREATE INDEX IF NOT EXISTS idx_participants_instance_name ON participants(instance_name);
CREATE INDEX IF NOT EXISTS idx_participants_last_interaction ON participants(last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS idx_participants_tags ON participants USING GIN(tags);

-- Button Engagements
CREATE INDEX IF NOT EXISTS idx_button_engagements_participant_id ON button_engagements(participant_id);
CREATE INDEX IF NOT EXISTS idx_button_engagements_template_id ON button_engagements(template_id);
CREATE INDEX IF NOT EXISTS idx_button_engagements_user_id ON button_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_button_engagements_clicked_at ON button_engagements(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_button_engagements_phone_number ON button_engagements(phone_number);
CREATE INDEX IF NOT EXISTS idx_button_engagements_button_id ON button_engagements(button_id);

-- Participant Responses
CREATE INDEX IF NOT EXISTS idx_participant_responses_participant_id ON participant_responses(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_responses_user_id ON participant_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_responses_received_at ON participant_responses(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_participant_responses_phone_number ON participant_responses(phone_number);

-- Template Engagement Metrics
CREATE INDEX IF NOT EXISTS idx_template_metrics_template_id ON template_engagement_metrics(template_id);
CREATE INDEX IF NOT EXISTS idx_template_metrics_user_id ON template_engagement_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_template_metrics_period ON template_engagement_metrics(period_start, period_end);

-- Conversation Sessions
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_participant_id ON conversation_sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_user_id ON conversation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_session_id ON conversation_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_status ON conversation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_conversation_sessions_started_at ON conversation_sessions(started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Participants
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participants"
  ON participants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participants"
  ON participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participants"
  ON participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participants"
  ON participants FOR DELETE
  USING (auth.uid() = user_id);

-- Button Engagements
ALTER TABLE button_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own button engagements"
  ON button_engagements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own button engagements"
  ON button_engagements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Participant Responses
ALTER TABLE participant_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own participant responses"
  ON participant_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participant responses"
  ON participant_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Template Engagement Metrics
ALTER TABLE template_engagement_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own template metrics"
  ON template_engagement_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own template metrics"
  ON template_engagement_metrics FOR ALL
  USING (auth.uid() = user_id);

-- Conversation Sessions
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversation sessions"
  ON conversation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conversation sessions"
  ON conversation_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS E FUNÇÕES
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_participants_updated_at
  BEFORE UPDATE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_metrics_updated_at
  BEFORE UPDATE ON template_engagement_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_sessions_updated_at
  BEFORE UPDATE ON conversation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas do participante
CREATE OR REPLACE FUNCTION update_participant_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar last_interaction_at e total_messages_sent
  UPDATE participants
  SET 
    last_interaction_at = NOW(),
    total_messages_sent = total_messages_sent + 1,
    updated_at = NOW()
  WHERE phone_number = NEW.recipient
    AND instance_name = NEW.instance_name
    AND user_id = NEW.user_id;
  
  -- Se o participante não existir, criar
  IF NOT FOUND THEN
    INSERT INTO participants (
      phone_number,
      instance_name,
      user_id,
      total_messages_sent,
      last_interaction_at,
      first_contact_at
    ) VALUES (
      NEW.recipient,
      NEW.instance_name,
      NEW.user_id,
      1,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar stats quando mensagem é enviada
CREATE TRIGGER update_participant_stats_on_send
  AFTER INSERT ON message_send_history
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION update_participant_stats();

-- Função para calcular tempo de resposta
CREATE OR REPLACE FUNCTION calculate_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.message_sent_at IS NOT NULL THEN
    NEW.response_time_seconds = EXTRACT(EPOCH FROM (NEW.clicked_at - NEW.message_sent_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular response_time automaticamente
CREATE TRIGGER calculate_response_time_trigger
  BEFORE INSERT ON button_engagements
  FOR EACH ROW
  EXECUTE FUNCTION calculate_response_time();

-- Função para atualizar métricas de template
CREATE OR REPLACE FUNCTION update_template_engagement_metrics()
RETURNS TRIGGER AS $$
DECLARE
  metric_record RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  -- Buscar ou criar registro de métrica para hoje
  SELECT * INTO metric_record
  FROM template_engagement_metrics
  WHERE template_id = NEW.template_id
    AND period_start = today
    AND period_end = today
    AND period_type = 'daily';
  
  IF NOT FOUND THEN
    -- Criar novo registro
    INSERT INTO template_engagement_metrics (
      template_id,
      user_id,
      period_start,
      period_end,
      period_type,
      total_button_clicks,
      unique_participants_engaged
    ) VALUES (
      NEW.template_id,
      NEW.user_id,
      today,
      today,
      'daily',
      1,
      1
    );
  ELSE
    -- Atualizar registro existente
    UPDATE template_engagement_metrics
    SET 
      total_button_clicks = total_button_clicks + 1,
      updated_at = NOW()
    WHERE id = metric_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar métricas quando botão é clicado
CREATE TRIGGER update_metrics_on_button_click
  AFTER INSERT ON button_engagements
  FOR EACH ROW
  WHEN (NEW.template_id IS NOT NULL)
  EXECUTE FUNCTION update_template_engagement_metrics();

-- ============================================================================
-- VIEWS ÚTEIS PARA ANÁLISE
-- ============================================================================

-- View: Participantes mais engajados
CREATE OR REPLACE VIEW v_top_engaged_participants AS
SELECT 
  p.id,
  p.phone_number,
  p.name,
  p.whatsapp_name,
  p.instance_name,
  p.total_messages_sent,
  p.total_messages_received,
  p.last_interaction_at,
  COUNT(DISTINCT be.id) as total_button_clicks,
  COUNT(DISTINCT pr.id) as total_responses,
  p.tags,
  p.user_id
FROM participants p
LEFT JOIN button_engagements be ON p.id = be.participant_id
LEFT JOIN participant_responses pr ON p.id = pr.participant_id
GROUP BY p.id
ORDER BY total_button_clicks DESC, p.last_interaction_at DESC;

-- View: Performance de templates
CREATE OR REPLACE VIEW v_template_performance AS
SELECT 
  mt.id,
  mt.name,
  mt.type,
  mt.sent_count,
  mt.last_sent,
  COUNT(DISTINCT be.id) as total_engagements,
  COUNT(DISTINCT be.participant_id) as unique_participants,
  ROUND(
    CASE 
      WHEN mt.sent_count > 0 
      THEN (COUNT(DISTINCT be.participant_id)::DECIMAL / mt.sent_count * 100)
      ELSE 0 
    END, 
    2
  ) as engagement_rate_percent,
  AVG(be.response_time_seconds) as avg_response_time_seconds,
  mt.user_id
FROM message_templates mt
LEFT JOIN button_engagements be ON mt.id = be.template_id
GROUP BY mt.id
ORDER BY engagement_rate_percent DESC;

-- View: Engajamento por botão
CREATE OR REPLACE VIEW v_button_engagement_analysis AS
SELECT 
  be.template_id,
  mt.name as template_name,
  be.button_id,
  be.button_text,
  be.button_type,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT be.participant_id) as unique_clickers,
  AVG(be.response_time_seconds) as avg_response_time,
  MIN(be.clicked_at) as first_click,
  MAX(be.clicked_at) as last_click,
  be.user_id
FROM button_engagements be
LEFT JOIN message_templates mt ON be.template_id = mt.id
GROUP BY 
  be.template_id, 
  mt.name, 
  be.button_id, 
  be.button_text, 
  be.button_type,
  be.user_id
ORDER BY total_clicks DESC;

-- View: Atividade recente
CREATE OR REPLACE VIEW v_recent_activity AS
SELECT 
  'button_click' as activity_type,
  be.id,
  be.phone_number,
  be.participant_name,
  be.template_name,
  be.button_text as activity_detail,
  be.clicked_at as activity_at,
  be.user_id
FROM button_engagements be
UNION ALL
SELECT 
  'response' as activity_type,
  pr.id,
  pr.phone_number,
  NULL as participant_name,
  NULL as template_name,
  LEFT(pr.response_text, 50) as activity_detail,
  pr.received_at as activity_at,
  pr.user_id
FROM participant_responses pr
ORDER BY activity_at DESC
LIMIT 100;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE participants IS 'Armazena informações sobre contatos/participantes que recebem mensagens';
COMMENT ON TABLE button_engagements IS 'Registra cada clique em botões de mensagens interativas';
COMMENT ON TABLE participant_responses IS 'Armazena respostas textuais dos participantes';
COMMENT ON TABLE template_engagement_metrics IS 'Métricas agregadas de engajamento por template';
COMMENT ON TABLE conversation_sessions IS 'Agrupa interações em sessões de conversa';

COMMENT ON COLUMN participants.tags IS 'Array de tags para categorização (ex: cliente, vip, suporte)';
COMMENT ON COLUMN participants.custom_fields IS 'Campos personalizados em formato JSON';
COMMENT ON COLUMN button_engagements.response_time_seconds IS 'Tempo entre envio da mensagem e clique no botão';
COMMENT ON COLUMN template_engagement_metrics.button_metrics IS 'Métricas detalhadas por botão em formato JSON';

// ============================================================================
// TYPES FOR PARTICIPANT ENGAGEMENT TRACKING
// ============================================================================

export interface Participant {
  id: string;
  phone_number: string;
  name?: string;
  profile_picture_url?: string;
  instance_name: string;
  user_id: string;
  
  // WhatsApp metadata
  whatsapp_name?: string;
  is_business: boolean;
  business_description?: string;
  
  // Additional info
  tags?: string[];
  notes?: string;
  custom_fields?: Record<string, any>;
  
  // Statistics
  total_messages_sent: number;
  total_messages_received: number;
  last_interaction_at?: string;
  first_contact_at: string;
  
  // Control
  is_blocked: boolean;
  blocked_at?: string;
  blocked_reason?: string;
  
  created_at: string;
  updated_at: string;
}

export interface ButtonEngagement {
  id: string;
  
  // References
  participant_id?: string;
  template_id?: string;
  message_send_history_id?: string;
  user_id: string;
  
  // Participant info (denormalized)
  phone_number: string;
  participant_name?: string;
  instance_name: string;
  
  // Message info
  template_name?: string;
  template_type?: string;
  message_content?: any;
  
  // Button info
  button_id: string;
  button_text: string;
  button_type?: 'quick_reply' | 'list_item' | 'call_to_action';
  button_position?: number;
  
  // Interaction context
  interaction_type: string;
  response_time_seconds?: number;
  
  // Additional metadata
  device_info?: any;
  location_data?: any;
  session_id?: string;
  
  // Timestamps
  clicked_at: string;
  message_sent_at?: string;
  created_at: string;
}

export interface ParticipantResponse {
  id: string;
  
  // References
  participant_id?: string;
  button_engagement_id?: string;
  user_id: string;
  
  // Response info
  phone_number: string;
  instance_name: string;
  response_text: string;
  response_type: 'text' | 'media' | 'voice' | 'document';
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'document';
  
  // Context
  is_reply_to_button: boolean;
  related_template_id?: string;
  conversation_id?: string;
  
  // Sentiment analysis
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_score?: number;
  
  // Timestamps
  received_at: string;
  created_at: string;
}

export interface TemplateEngagementMetrics {
  id: string;
  
  // References
  template_id: string;
  user_id: string;
  
  // Period
  period_start: string;
  period_end: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  
  // Send metrics
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  
  // Engagement metrics
  total_button_clicks: number;
  unique_participants_engaged: number;
  total_responses_received: number;
  
  // Button-specific metrics
  button_metrics?: Record<string, {
    clicks: number;
    text: string;
    unique_clickers?: number;
  }>;
  
  // Conversion rates
  engagement_rate?: number;
  response_rate?: number;
  average_response_time_seconds?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ConversationSession {
  id: string;
  
  // References
  participant_id: string;
  user_id: string;
  
  // Session info
  session_id: string;
  phone_number: string;
  instance_name: string;
  
  // Status
  status: 'active' | 'completed' | 'abandoned';
  
  // Metrics
  total_messages_sent: number;
  total_messages_received: number;
  total_button_clicks: number;
  
  // Templates used
  templates_used?: string[];
  
  // Timestamps
  started_at: string;
  last_activity_at: string;
  ended_at?: string;
  
  // Duration
  duration_seconds?: number;
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface TopEngagedParticipant {
  id: string;
  phone_number: string;
  name?: string;
  whatsapp_name?: string;
  instance_name: string;
  total_messages_sent: number;
  total_messages_received: number;
  last_interaction_at?: string;
  total_button_clicks: number;
  total_responses: number;
  tags?: string[];
  user_id: string;
}

export interface TemplatePerformance {
  id: string;
  name: string;
  type: string;
  sent_count: number;
  last_sent?: string;
  total_engagements: number;
  unique_participants: number;
  engagement_rate_percent: number;
  avg_response_time_seconds?: number;
  user_id: string;
}

export interface ButtonEngagementAnalysis {
  template_id?: string;
  template_name?: string;
  button_id: string;
  button_text: string;
  button_type?: string;
  total_clicks: number;
  unique_clickers: number;
  avg_response_time?: number;
  first_click: string;
  last_click: string;
  user_id: string;
}

export interface RecentActivity {
  activity_type: 'button_click' | 'response';
  id: string;
  phone_number: string;
  participant_name?: string;
  template_name?: string;
  activity_detail?: string;
  activity_at: string;
  user_id: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface EngagementStats {
  totalParticipants: number;
  activeParticipants: number;
  totalButtonClicks: number;
  totalResponses: number;
  averageResponseTime: number;
  engagementRate: number;
  topEngagedParticipants: TopEngagedParticipant[];
  recentActivity: RecentActivity[];
}

export interface TemplateAnalytics {
  templateId: string;
  templateName: string;
  performance: TemplatePerformance;
  buttonAnalysis: ButtonEngagementAnalysis[];
  timeSeriesData: {
    date: string;
    clicks: number;
    uniqueParticipants: number;
  }[];
}

export interface ParticipantProfile {
  participant: Participant;
  engagements: ButtonEngagement[];
  responses: ParticipantResponse[];
  sessions: ConversationSession[];
  stats: {
    totalEngagements: number;
    totalResponses: number;
    averageResponseTime: number;
    lastActivity: string;
    favoriteTemplates: {
      templateId: string;
      templateName: string;
      interactionCount: number;
    }[];
  };
}

// ============================================================================
// WEBHOOK PAYLOAD TYPES (for receiving engagement data)
// ============================================================================

export interface ButtonClickWebhookPayload {
  instanceName: string;
  event: 'messages.upsert';
  data: {
    key: {
      remoteJid: string; // phone number
      fromMe: boolean;
      id: string;
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
        title: string;
      };
    };
    messageTimestamp: number;
  };
}

export interface MessageResponseWebhookPayload {
  instanceName: string;
  event: 'messages.upsert';
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
      imageMessage?: {
        url: string;
        caption?: string;
      };
      videoMessage?: {
        url: string;
        caption?: string;
      };
      audioMessage?: {
        url: string;
      };
      documentMessage?: {
        url: string;
        fileName?: string;
      };
    };
    messageTimestamp: number;
  };
}

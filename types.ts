
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  last_login?: string;
  avatar_url?: string;
}

export interface EvoInstanceCount {
  Message: number;
  Contact: number;
  Chat: number;
}

export interface EvoInstance {
  instanceName: string;
  instanceId: string;
  status: 'close' | 'open' | 'connecting' | 'qrcode';
  owner: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  serverUrl?: string;
  apikey?: string; // Instance specific key if returned
  _count?: EvoInstanceCount; // Aggregate counts from the API
}

export interface EvoInstanceCreatePayload {
  instanceName: string;
  token?: string; // Optional: Security token for this specific instance
  qrcode?: boolean; // Return QR immediately?
}

export interface MessageMetrics {
  date: string;
  sent: number;
  received: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface WebhookPayload {
  user_id: string;
  session_id: string;
  message: string;
}

export interface ConnectResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

export interface GroupParticipant {
  id: string;
  admin: 'admin' | 'superadmin' | null;
}

// types.ts — atualize seu tipo de grupo com base na API real
export interface EvoGroup {
  id: string; // groupJid, ex: "123456789@g.us"
  subject: string;
  subjectOwner?: string;
  subjectTime?: number; // timestamp Unix
  creation?: number; // timestamp Unix
  owner?: string; // JID do criador
  desc?: string;
  descOwner?: string;
  descTime?: number;
  size?: number;
  participants?: EvoGroupParticipant[];
}

export interface EvoGroupParticipant {
  id: string; // ex: "551199999999@c.us"
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

// Mock Data Interfaces for fallback
export interface DashboardStats {
  totalInstances: number;
  activeConnections: number;
  totalMessages: number;
  totalContacts: number;
}
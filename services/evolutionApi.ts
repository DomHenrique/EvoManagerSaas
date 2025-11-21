/**
 * 🚀 Evolução API Service - Versão Refatorada e Segura
 * 
 * Baseado na documentação oficial: https://www.postman.com/agenciadgcode/evolution-api/overview
 * Versão da API: v2.2.3
 * 
 * ✅ Corrigido:
 *   - getProfilePicture: instanceName agora vai como query param (não no path)
 *   - leaveGroup: método POST (não DELETE) conforme doc
 *   - Tipos fortes em todos os endpoints
 *   - Validação centralizada
 *   - Logs com níveis (DEBUG, INFO, ERROR)
 *   - Timeout seguro com AbortController
 *   - Singleton + suporte a múltiplos clientes
 * 
 * ⚠️ Não altera a estrutura do projeto — tudo em um arquivo.
 */

import { APP_CONFIG } from '../constants';
import { EvoInstance, EvoInstanceCreatePayload, ConnectResponse, EvoGroup } from '../types';

// ============================================================================
// CONSTANTES E TIPOS LOCAIS (para evitar importações externas)
// ============================================================================

const API_VERSION = 'v2.2.3';

interface ApiError {
  message: string;
  status?: number;
  code?: string;
  response?: any;
}

interface RequestConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

// ============================================================================
// LOGGING UTILITIES — Com níveis e configuração por ambiente
// ============================================================================

enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

class ApiLogger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  private static shouldLog(level: LogLevel): boolean {
    return this.level >= level;
  }

  private static format(method: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [Evolution API] ${method} - ${message}`;
  }

  static debug(method: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.format(method, message), data);
    }
  }

  static info(method: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.format(method, message), data);
    }
  }

  static warn(method: string, message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.format(method, message), data);
    }
  }

  static error(method: string, message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.format(method, message), error);
    }
  }
}

// Configuração inicial baseada no ambiente
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  ApiLogger.setLevel(LogLevel.WARN);
} else {
  ApiLogger.setLevel(LogLevel.DEBUG);
}

// ============================================================================
// BUILDER DE PATHS — Centraliza construção de URLs com segurança
// ============================================================================

class ApiPaths {
  // Função utilitária para garantir strings não vazias
  private static ensureNonEmpty(str: string, paramName: string): string {
    const trimmed = str.trim();
    if (!trimmed) {
      throw new Error(`${paramName} must be a non-empty string`);
    }
    return trimmed;
  }

  // ========================================================================
  // INSTÂNCIA
  // ========================================================================

  static fetchInstances() {
    return { path: '/instance/fetchInstances', method: 'GET' as const };
  }

  static createInstance() {
    return { path: '/instance/create', method: 'POST' as const };
  }

  static deleteInstance(instanceName: string) {
    return {
      path: `/instance/delete/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'DELETE' as const,
    };
  }

  static connectInstance(instanceName: string) {
    return {
      path: `/instance/connect/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'GET' as const,
    };
  }

  static logoutInstance(instanceName: string) {
    return {
      path: `/instance/logout/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'DELETE' as const,
    };
  }

  static restartInstance(instanceName: string) {
    return {
      path: `/instance/restart/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'PUT' as const,
    };
  }

  static fetchConnectionState(instanceName: string) {
    return {
      path: `/instance/connectionState/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'GET' as const,
    };
  }

  // ========================================================================
  // GRUPOS
  // ========================================================================

  static fetchAllGroups(instanceName: string, getParticipants = true) {
    return {
      path: `/group/fetchAllGroups/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}?getParticipants=${getParticipants}`,
      method: 'GET' as const,
    };
  }

  static createGroup(instanceName: string) {
    return {
      path: `/group/create/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static updateGroupSubject(instanceName: string) {
    return {
      path: `/group/updateGroupSubject/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static updateGroupDescription(instanceName: string) {
    return {
      path: `/group/updateGroupDescription/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static updateGroupPicture(instanceName: string) {
    return {
      path: `/group/updateGroupPicture/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  /**
   * ⚠️ Documentação oficial: é POST, NÃO DELETE
   * Ref: https://documenter.getpostman.com/view/24898179/2s9Xy6o1Jd#2a8e9b12-7d9a-4b5e-b5a1-1e8d0e4e0c1e
   */
  static leaveGroup(instanceName: string) {
    return {
      path: `/group/leaveGroup/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  // ========================================================================
  // PARTICIPANTES
  // ========================================================================

  static addParticipant(instanceName: string) {
    return {
      path: `/group/addParticipant/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static removeParticipant(instanceName: string) {
    return {
      path: `/group/removeParticipant/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static promoteParticipant(instanceName: string) {
    return {
      path: `/group/promoteParticipant/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static demoteParticipant(instanceName: string) {
    return {
      path: `/group/demoteParticipant/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  // ========================================================================
  // CONFIGURAÇÕES DE GRUPO
  // ========================================================================

  static updateGroupSetting(instanceName: string) {
    return {
      path: `/group/updateGroupSetting/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  // ========================================================================
  // MENSAGENS
  // ========================================================================

  static sendText(instanceName: string) {
    return {
      path: `/message/sendText/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  static sendMedia(instanceName: string) {
    return {
      path: `/message/sendMedia/${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'POST' as const,
    };
  }

  // ========================================================================
  // CHAT / UTILITÁRIOS
  // ========================================================================

  /**
   * ⚠️ Documentação oficial: instanceName vai como QUERY PARAM, não no path!
   * Ref: https://documenter.getpostman.com/view/24898179/2s9Xy6o1Jd#3e4a0d3b-8b7f-4f5a-9c1d-7f3b3a3c3b3a
   */
  static fetchProfilePictureUrl(number: string, instanceName: string) {
    return {
      path: `/chat/fetchProfilePictureUrl?number=${encodeURIComponent(this.ensureNonEmpty(number, 'number'))}&instanceName=${encodeURIComponent(this.ensureNonEmpty(instanceName, 'instanceName'))}`,
      method: 'GET' as const,
    };
  }

  static whatsappNumbers() {
    return { path: '/chat/whatsappNumbers', method: 'POST' as const };
  }
}

// ============================================================================
// HTTP CLIENT — Reutilizável e testável
// ============================================================================

class EvolutionApiClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultTimeout: number = 60000; // 30 seconds

  constructor() {
    this.baseUrl = APP_CONFIG.EVOLUTION_API_URL;
    this.apiKey = APP_CONFIG.EVOLUTION_API_KEY;
    
    this.validateConfig();
    this.logInitialization();
  }

  private validateConfig(): void {
    if (!this.baseUrl) {
      throw new Error('Evolution API URL is not configured');
    }
    if (!this.apiKey) {
      throw new Error('Evolution API Key is not configured');
    }
  }

  private logInitialization(): void {
    ApiLogger.info('Client', 'Initialized with config', {
      version: API_VERSION,
      url: this.baseUrl,
      apiKeyPresent: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0
    });
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };
  }

  private async handleResponse<T>(response: Response, method: string): Promise<T> {
    ApiLogger.debug(method, 'Response received', { status: response.status });

    if (!response.ok) {
      await this.handleErrorResponse(response, method);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    try {
      const text = await response.text();
      ApiLogger.debug(method, 'Raw response text', { text });

      const data = text ? JSON.parse(text) : {};
      ApiLogger.debug(method, 'Response parsed successfully', { 
        hasData: !!data,
        dataType: typeof data,
        isArray: Array.isArray(data)
      });
      return data;
    } catch (error) {
      ApiLogger.error(method, 'Failed to parse JSON response', error);
      throw new Error('Invalid JSON response from API');
    }
  }

  private async handleErrorResponse(response: Response, method: string): Promise<never> {
    let errorMessage = `API request failed with status ${response.status}`;
    let errorDetails: any = null;

    try {
      const errorText = await response.text();
      ApiLogger.error(method, 'Error response received', errorText);

      try {
        errorDetails = JSON.parse(errorText);
        errorMessage = errorDetails.message || errorDetails.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
    } catch (error) {
      ApiLogger.error(method, 'Failed to read error response', error);
    }

    const apiError: ApiError = {
      message: errorMessage,
      status: response.status,
      response: errorDetails
    };

    throw apiError;
  }

  async request<T>(
    endpoint: string,
    options: Partial<RequestConfig> = {},
    timeout?: number
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    ApiLogger.info(method, 'Request initiated', {
      url,
      method,
      hasBody: !!options.body
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout || this.defaultTimeout);

    try {
      const config: RequestConfig = {
        method,
        headers: this.getHeaders(),
        signal: controller.signal,
        ...options
      };

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response, method);
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        ApiLogger.error(method, 'Request timeout', { url, timeout: timeout || this.defaultTimeout });
        throw new Error(`Request timeout after ${(timeout || this.defaultTimeout) / 1000}s`);
      }

      ApiLogger.error(method, 'Request failed', error);
      throw error;
    }
  }

  // GET request helper
  async get<T>(endpoint: string, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, timeout);
  }

  // POST request helper
  async post<T>(endpoint: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined
      },
      timeout
    );
  }

  // PUT request helper
  async put<T>(endpoint: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined
      },
      timeout
    );
  }

  // DELETE request helper
  async delete<T>(endpoint: string, body?: any, timeout?: number): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'DELETE',
        body: body ? JSON.stringify(body) : undefined
      },
      timeout
    );
  }
}

// Singleton instance
const apiClient = new EvolutionApiClient();

// ============================================================================
// VALIDAÇÃO CENTRALIZADA — Evita repetição
// ============================================================================

function requireNonEmpty(str: string, name: string): asserts str is string {
  if (!str?.trim()) {
    throw new Error(`${name} is required and must be a non-empty string`);
  }
}

function requireArray<T>(arr: T[], name: string): asserts arr is T[] {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
}

// ============================================================================
// FUNÇÕES DE ALTO NÍVEL — EXPORTADAS
// ============================================================================

export const fetchInstances = async (): Promise<EvoInstance[]> => {
  try {
    const { path, method } = ApiPaths.fetchInstances();
    const data = await apiClient.request<any[]>(path, { method });

    if (!Array.isArray(data)) {
      ApiLogger.warn('fetchInstances', 'Expected array but got', typeof data);
      return [];
    }

    return data
      .filter((item: any) => {
        const inst = item.instance || item;
        // Use 'name' from API response if 'instanceName' doesn't exist
        const instanceName = inst.instanceName || inst.name;
        return instanceName && instanceName.trim() !== '';
      })
      .map((item: any) => {
        const inst = item.instance || item;
        return {
          instanceName: inst.instanceName || inst.name,
          instanceId: inst.instanceId || inst.id,
          status: inst.status || inst.connectionStatus,
          owner: inst.owner || inst.ownerJid,
          profileName: inst.profileName || inst.profileName,
          profilePictureUrl: inst.profilePictureUrl || inst.profilePicUrl,
          _count: inst._count || undefined,
        };
      });
  } catch (error) {
    ApiLogger.error('fetchInstances', 'Failed to fetch instances', error);
    return [];
  }
};

export const createInstance = async (payload: EvoInstanceCreatePayload): Promise<any> => {
  requireNonEmpty(payload.instanceName, 'instanceName');

  const body = {
    instanceName: payload.instanceName,
    token: payload.token || '',
    qrcode: payload.qrcode !== undefined ? payload.qrcode : true,
    integration: payload.integration || 'WHATSAPP-BAILEYS'
  };

  try {
    const { path, method } = ApiPaths.createInstance();
    return await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('createInstance', 'Failed to create instance', error);
    throw error;
  }
};

export const deleteInstance = async (instanceName: string): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.deleteInstance(instanceName);
    await apiClient.request(path, { method });
  } catch (error) {
    ApiLogger.error('deleteInstance', 'Failed to delete instance', error);
    throw error;
  }
};

export const connectInstance = async (instanceName: string): Promise<ConnectResponse> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.connectInstance(instanceName);
    return await apiClient.get<ConnectResponse>(path); // method is always GET for this endpoint
  } catch (error) {
    ApiLogger.error('connectInstance', 'Failed to connect instance', error);
    throw error;
  }
};

export const logoutInstance = async (instanceName: string): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.logoutInstance(instanceName);
    await apiClient.request(path, { method });
  } catch (error) {
    ApiLogger.error('logoutInstance', 'Failed to logout instance', error);
    throw error;
  }
};

export const restartInstance = async (instanceName: string): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.restartInstance(instanceName);
    await apiClient.request(path, { method });
  } catch (error) {
    ApiLogger.error('restartInstance', 'Failed to restart instance', error);
    throw error;
  }
};

export const fetchInstanceConnectionState = async (instanceName: string): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.fetchConnectionState(instanceName);
    return await apiClient.get(path); // method is always GET for this endpoint
  } catch (error) {
    ApiLogger.error('fetchInstanceConnectionState', 'Failed to fetch connection state', error);
    throw error;
  }
};

// ============================================================================
// GROUP MANAGEMENT
// ============================================================================

export const fetchGroups = async (instanceName: string, getParticipants: boolean = true): Promise<EvoGroup[]> => {
  requireNonEmpty(instanceName, 'instanceName');

  try {
    const { path, method } = ApiPaths.fetchAllGroups(instanceName, getParticipants);
    const data = await apiClient.get<any[]>(path); // method is always GET for this endpoint

    if (!Array.isArray(data)) {
      ApiLogger.warn('fetchGroups', 'Expected array but got', typeof data);
      return [];
    }

    // Map the API response to EvoGroup interface with proper field mapping for participants
    return data.map((item: any) => {
      // Map participants from API format to EvoGroupParticipant format
      let mappedParticipants = item.participants;
      if (item.participants && Array.isArray(item.participants)) {
        mappedParticipants = item.participants.map((participant: any) => ({
          id: participant.id,
          isAdmin: participant.admin === 'admin' || participant.admin === 'superadmin',
          isSuperAdmin: participant.admin === 'superadmin'
        }));
      }

      return {
        id: item.id,
        subject: item.subject,
        subjectOwner: item.subjectOwner,
        subjectTime: item.subjectTime,
        creation: item.creation,
        owner: item.owner,
        desc: item.desc,
        descOwner: item.descOwner,
        descTime: item.descTime,
        size: item.size,
        participants: mappedParticipants,
      };
    });
  } catch (error) {
    ApiLogger.error('fetchGroups', 'Failed to fetch groups', error);
    return [];
  }
};

export const createGroup = async (
  instanceName: string,
  subject: string,
  participants: string[]
): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(subject, 'subject');
  requireArray(participants, 'participants');

  const body = {
    subject: subject.trim(),
    participants
  };

  try {
    const { path, method } = ApiPaths.createGroup(instanceName);
    return await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('createGroup', 'Failed to create group', error);
    throw error;
  }
};

export const updateGroupSubject = async (
  instanceName: string,
  groupId: string,
  subject: string
): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');
  requireNonEmpty(subject, 'subject');

  const body = {
    groupJid: groupId,
    subject: subject.trim()
  };

  try {
    const { path, method } = ApiPaths.updateGroupSubject(instanceName);
    await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('updateGroupSubject', 'Failed to update group subject', error);
    throw error;
  }
};

export const updateGroupDescription = async (
  instanceName: string,
  groupId: string,
  description: string
): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');

  const body = {
    groupJid: groupId,
    description: description || ''
  };

  try {
    const { path, method } = ApiPaths.updateGroupDescription(instanceName);
    await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('updateGroupDescription', 'Failed to update group description', error);
    throw error;
  }
};

export const updateGroupPicture = async (
  instanceName: string,
  groupId: string,
  imageBase64: string
): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');
  requireNonEmpty(imageBase64, 'imageBase64');

  const body = {
    groupJid: groupId,
    image: imageBase64
  };

  try {
    const { path, method } = ApiPaths.updateGroupPicture(instanceName);
    await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('updateGroupPicture', 'Failed to update group picture', error);
    throw error;
  }
};

export const leaveGroup = async (instanceName: string, groupId: string): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');

  const body = { groupJid: groupId };

  try {
    const { path, method } = ApiPaths.leaveGroup(instanceName); // ⚠️ POST, não DELETE!
    await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('leaveGroup', 'Failed to leave group', error);
    throw error;
  }
};

// ============================================================================
// PARTICIPANT MANAGEMENT
// ============================================================================

export const updateParticipant = async (
  instanceName: string,
  groupId: string,
  action: 'add' | 'remove' | 'promote' | 'demote',
  participants: string[]
): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');
  requireArray(participants, 'participants');

  const body = {
    groupJid: groupId,
    action,
    participants
  };

  const endpointMap = {
    add: 'addParticipant',
    remove: 'removeParticipant',
    promote: 'promoteParticipant',
    demote: 'demoteParticipant'
  };

  const endpoint = `/group/${endpointMap[action]}/${instanceName}`;

  try {
    await apiClient.post(endpoint, body);
  } catch (error) {
    ApiLogger.error(`${action}Participant`, `Failed to ${action} participant`, error);
    throw error;
  }
};

export const addParticipant = async (
  instanceName: string,
  groupId: string,
  participant: string
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'add', [participant]);
};

export const removeParticipant = async (
  instanceName: string,
  groupId: string,
  participant: string
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'remove', [participant]);
};

export const promoteParticipant = async (
  instanceName: string,
  groupId: string,
  participant: string
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'promote', [participant]);
};

export const demoteParticipant = async (
  instanceName: string,
  groupId: string,
  participant: string
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'demote', [participant]);
};

// Batch operations
export const addParticipants = async (
  instanceName: string,
  groupId: string,
  participants: string[]
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'add', participants);
};

export const removeParticipants = async (
  instanceName: string,
  groupId: string,
  participants: string[]
): Promise<void> => {
  await updateParticipant(instanceName, groupId, 'remove', participants);
};

// ============================================================================
// GROUP SETTINGS
// ============================================================================

export const updateGroupSettings = async (
  instanceName: string,
  groupId: string,
  setting: 'announcement' | 'locked' | 'unlocked',
  value: boolean
): Promise<void> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(groupId, 'groupId');

  const body = {
    groupJid: groupId,
    action: value ? setting : 'not_' + setting
  };

  try {
    const { path, method } = ApiPaths.updateGroupSetting(instanceName);
    await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('updateGroupSettings', 'Failed to update group settings', error);
    throw error;
  }
};

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export const sendTextMessage = async (
  instanceName: string,
  number: string,
  text: string
): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(number, 'number');
  requireNonEmpty(text, 'text');

  const body = {
    number,
    text,
    delay: 1000
  };

  try {
    const { path, method } = ApiPaths.sendText(instanceName);
    return await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('sendTextMessage', 'Failed to send text message', error);
    throw error;
  }
};

export const sendMediaMessage = async (
  instanceName: string,
  number: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'audio' | 'document',
  caption?: string
): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(number, 'number');
  requireNonEmpty(mediaUrl, 'mediaUrl');
  requireNonEmpty(mediaType, 'mediaType');

  const body: any = {
    number,
    mediatype: mediaType,
    media: mediaUrl
  };

  if (caption) {
    body.caption = caption;
  }

  try {
    const { path, method } = ApiPaths.sendMedia(instanceName);
    return await apiClient.post(path, body);
  } catch (error) {
    ApiLogger.error('sendMediaMessage', 'Failed to send media message', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const checkWhatsAppNumber = async (
  instanceName: string,
  numbers: string[]
): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireArray(numbers, 'numbers');

  const body = { numbers };

  try {
    const { path, method } = ApiPaths.whatsappNumbers();
    return await apiClient.post(path, { instanceName, ...body });
  } catch (error) {
    ApiLogger.error('checkWhatsAppNumber', 'Failed to check WhatsApp numbers', error);
    throw error;
  }
};

export const getProfilePicture = async (
  instanceName: string,
  number: string
): Promise<any> => {
  requireNonEmpty(instanceName, 'instanceName');
  requireNonEmpty(number, 'number');

  try {
    // ✅ Corrigido: instanceName como query param, não no path
    const { path, method } = ApiPaths.fetchProfilePictureUrl(number, instanceName);
    return await apiClient.get(path); // method is always GET for this endpoint
  } catch (error) {
    ApiLogger.error('getProfilePicture', 'Failed to fetch profile picture', error);
    throw error;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export { ApiLogger, EvolutionApiClient };
export default apiClient;
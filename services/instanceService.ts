/**
 * 🔄 Instance Service - Database Operations for Evolution API Instances
 * 
 * Manages instance data persistence and synchronization between Evolution API and Supabase.
 * 
 * Features:
 * - CRUD operations for instances table
 * - Periodic sync from Evolution API
 * - Automatic status tracking
 * - Timestamp management (created_at, updated_at, connected_at, disconnected_at)
 * - User isolation via RLS
 */

import { supabase } from './supabase';
import { fetchInstances as fetchInstancesFromAPI } from './evolutionApi';
import { EvoInstance } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface InstanceRecord {
  id?: string;
  instanceName: string;
  instanceId?: string | null;
  status: string;
  owner?: string | null;
  profileName?: string | null;
  profilePictureUrl?: string | null;
  user_id: string;
  integration?: string;
  qrcode?: string | null;
  webhook_url?: string | null;
  webhook_events?: string[] | null;
  created_at?: string;
  updated_at?: string;
  connected_at?: string | null;
  disconnected_at?: string | null;
}

interface SyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  timestamp: string;
}

// ============================================================================
// LOGGING
// ============================================================================

class InstanceLogger {
  private static prefix = '[InstanceService]';

  static info(method: string, message: string, data?: any): void {
    console.info(`${this.prefix} ${method} - ${message}`, data || '');
  }

  static error(method: string, message: string, error?: any): void {
    console.error(`${this.prefix} ${method} - ${message}`, error || '');
  }

  static debug(method: string, message: string, data?: any): void {
    console.debug(`${this.prefix} ${method} - ${message}`, data || '');
  }
}

// ============================================================================
// PERIODIC SYNC MANAGER
// ============================================================================

class SyncManager {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning: boolean = false;
  private static currentUserId: string | null = null;

  static start(userId: string, intervalMs: number = 60000): void {
    if (this.isRunning && this.currentUserId === userId) {
      InstanceLogger.info('SyncManager', 'Sync already running for this user');
      return;
    }

    this.stop(); // Stop any existing sync
    this.currentUserId = userId;
    this.isRunning = true;

    InstanceLogger.info('SyncManager', `Starting periodic sync every ${intervalMs}ms for user ${userId}`);

    // Run initial sync immediately
    this.runSync(userId);

    // Schedule periodic syncs
    this.intervalId = setInterval(() => {
      this.runSync(userId);
    }, intervalMs);
  }

  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.currentUserId = null;
    InstanceLogger.info('SyncManager', 'Periodic sync stopped');
  }

  private static async runSync(userId: string): Promise<void> {
    try {
      InstanceLogger.debug('SyncManager', 'Running scheduled sync');
      await syncInstancesFromAPI(userId);
    } catch (error) {
      InstanceLogger.error('SyncManager', 'Sync failed', error);
    }
  }

  static isActive(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Save or update an instance in the database
 */
export const saveInstance = async (
  userId: string,
  instanceData: Partial<InstanceRecord>
): Promise<InstanceRecord | null> => {
  try {
    if (!instanceData.instanceName) {
      throw new Error('instanceName is required');
    }

    InstanceLogger.info('saveInstance', `Saving instance: ${instanceData.instanceName}`);

    // Check if instance already exists
    const { data: existing, error: fetchError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userId)
      .eq('instanceName', instanceData.instanceName)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError;
    }

    const now = new Date().toISOString();
    const record: Partial<InstanceRecord> = {
      ...instanceData,
      user_id: userId,
      updated_at: now,
    };

    // Track status changes for connected_at/disconnected_at
    if (existing) {
      const statusChanged = existing.status !== instanceData.status;
      
      if (statusChanged) {
        if (instanceData.status === 'open' && existing.status !== 'open') {
          record.connected_at = now;
        } else if (instanceData.status === 'close' && existing.status === 'open') {
          record.disconnected_at = now;
        }
      }

      // Update existing record
      const { data, error } = await supabase
        .from('instances')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      
      InstanceLogger.info('saveInstance', `Updated instance: ${instanceData.instanceName}`);
      return data;
    } else {
      // Insert new record
      record.created_at = now;
      if (instanceData.status === 'open') {
        record.connected_at = now;
      }

      const { data, error } = await supabase
        .from('instances')
        .insert([record])
        .select()
        .single();

      if (error) throw error;
      
      InstanceLogger.info('saveInstance', `Created instance: ${instanceData.instanceName}`);
      return data;
    }
  } catch (error) {
    InstanceLogger.error('saveInstance', 'Failed to save instance', error);
    throw error;
  }
};

/**
 * Get all instances for a user from the database
 */
export const getInstances = async (userId: string): Promise<EvoInstance[]> => {
  try {
    InstanceLogger.debug('getInstances', `Fetching instances for user: ${userId}`);

    const { data, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database records to EvoInstance format
    const instances: EvoInstance[] = (data || []).map((record: InstanceRecord) => ({
      instanceName: record.instanceName,
      instanceId: record.instanceId || undefined,
      status: record.status,
      owner: record.owner || undefined,
      profileName: record.profileName || undefined,
      profilePictureUrl: record.profilePictureUrl || undefined,
    }));

    InstanceLogger.info('getInstances', `Found ${instances.length} instances`);
    return instances;
  } catch (error) {
    InstanceLogger.error('getInstances', 'Failed to fetch instances', error);
    return [];
  }
};

/**
 * Delete an instance from the database
 */
export const deleteInstance = async (
  userId: string,
  instanceName: string
): Promise<void> => {
  try {
    InstanceLogger.info('deleteInstance', `Deleting instance: ${instanceName}`);

    const { error } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', userId)
      .eq('instanceName', instanceName);

    if (error) throw error;

    InstanceLogger.info('deleteInstance', `Deleted instance: ${instanceName}`);
  } catch (error) {
    InstanceLogger.error('deleteInstance', 'Failed to delete instance', error);
    throw error;
  }
};

/**
 * Sync instances from Evolution API to database
 */
export const syncInstancesFromAPI = async (userId: string): Promise<SyncResult> => {
  const result: SyncResult = {
    success: false,
    synced: 0,
    errors: [],
    timestamp: new Date().toISOString(),
  };

  try {
    InstanceLogger.info('syncInstancesFromAPI', 'Starting sync from Evolution API');

    // Fetch instances from Evolution API
    const apiInstances = await fetchInstancesFromAPI();
    
    if (!apiInstances || apiInstances.length === 0) {
      InstanceLogger.info('syncInstancesFromAPI', 'No instances found in API');
      result.success = true;
      return result;
    }

    InstanceLogger.debug('syncInstancesFromAPI', `Found ${apiInstances.length} instances in API`);

    // Get current instances from database
    const { data: dbInstances, error: fetchError } = await supabase
      .from('instances')
      .select('instanceName')
      .eq('user_id', userId);

    if (fetchError) {
      throw fetchError;
    }

    const dbInstanceNames = new Set((dbInstances || []).map(i => i.instanceName));
    const apiInstanceNames = new Set(apiInstances.map(i => i.instanceName));

    // Sync each API instance to database
    for (const apiInstance of apiInstances) {
      try {
        await saveInstance(userId, {
          instanceName: apiInstance.instanceName,
          instanceId: apiInstance.instanceId || null,
          status: apiInstance.status || 'close',
          owner: apiInstance.owner || null,
          profileName: apiInstance.profileName || null,
          profilePictureUrl: apiInstance.profilePictureUrl || null,
          integration: 'WHATSAPP-BAILEYS',
        });
        result.synced++;
      } catch (error: any) {
        const errorMsg = `Failed to sync ${apiInstance.instanceName}: ${error.message}`;
        InstanceLogger.error('syncInstancesFromAPI', errorMsg, error);
        result.errors.push(errorMsg);
      }
    }

    // Remove instances from DB that no longer exist in API
    const instancesToRemove = [...dbInstanceNames].filter(name => !apiInstanceNames.has(name));
    
    for (const instanceName of instancesToRemove) {
      try {
        InstanceLogger.info('syncInstancesFromAPI', `Removing deleted instance: ${instanceName}`);
        await deleteInstance(userId, instanceName);
      } catch (error: any) {
        const errorMsg = `Failed to remove ${instanceName}: ${error.message}`;
        InstanceLogger.error('syncInstancesFromAPI', errorMsg, error);
        result.errors.push(errorMsg);
      }
    }

    result.success = result.errors.length === 0;
    InstanceLogger.info('syncInstancesFromAPI', `Sync completed: ${result.synced} synced, ${result.errors.length} errors`);
    
    return result;
  } catch (error: any) {
    InstanceLogger.error('syncInstancesFromAPI', 'Sync failed', error);
    result.errors.push(error.message || 'Unknown error');
    return result;
  }
};

/**
 * Start periodic sync for a user
 */
export const startPeriodicSync = (userId: string, intervalMs: number = 60000): void => {
  SyncManager.start(userId, intervalMs);
};

/**
 * Stop periodic sync
 */
export const stopPeriodicSync = (): void => {
  SyncManager.stop();
};

/**
 * Check if periodic sync is active
 */
export const isSyncActive = (): boolean => {
  return SyncManager.isActive();
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  saveInstance,
  getInstances,
  deleteInstance,
  syncInstancesFromAPI,
  startPeriodicSync,
  stopPeriodicSync,
  isSyncActive,
};

import {
  fetchInstances
} from './evolutionApi';
import { EvoInstance, MessageMetrics, DashboardStats } from '../types';

/**
 * Fetch real dashboard statistics from Evolution API
 * Note: Evolution API doesn't provide direct message/contact counts,
 * so we'll implement what's available and return placeholder values
 * for metrics that require additional API endpoints
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get all instances to count total
    const instances = await fetchInstances();
    const totalInstances = instances.length;

    // Get active sessions (instances with 'open' status)
    const activeSessions = instances.filter(instance => instance.status === 'open').length;

    // Note: Evolution API does provide aggregate counts in the response
    // Let's extract them from the instances data that was just fetched
    let totalMessages = 0;
    let totalContacts = 0;

    // Sum up counts from all instances that have count information
    instances.forEach(instance => {
      // Instance data seems to include counts in the _count field
      // If available, use these values, otherwise keep zero
      if (instance._count) {
        totalMessages += instance._count.Message || 0;
        totalContacts += instance._count.Contact || 0;
      }
    });

    return {
      totalInstances,
      activeConnections: activeSessions,
      totalMessages,
      totalContacts
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      totalInstances: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalContacts: 0,
    };
  }
};

/**
 * Fetch message metrics for charts
 * Note: Evolution API doesn't provide direct message history endpoints,
 * so we return placeholder data
 */
export const fetchMessageMetrics = async (): Promise<MessageMetrics[]> => {
  try {
    // Note: Evolution API doesn't provide direct message history endpoints
    // In a real implementation, this would require:
    // 1. A custom endpoint to fetch message history
    // 2. Access to the database directly
    // 3. Integration with webhook data

    // For now, return placeholder data
    return [
      { date: 'Mon', sent: 0, received: 0 },
      { date: 'Tue', sent: 0, received: 0 },
      { date: 'Wed', sent: 0, received: 0 },
      { date: 'Thu', sent: 0, received: 0 },
      { date: 'Fri', sent: 0, received: 0 },
      { date: 'Sat', sent: 0, received: 0 },
      { date: 'Sun', sent: 0, received: 0 },
    ];
  } catch (error) {
    console.error('Error fetching message metrics:', error);
    // Return default data in case of error
    return [
      { date: 'Mon', sent: 0, received: 0 },
      { date: 'Tue', sent: 0, received: 0 },
      { date: 'Wed', sent: 0, received: 0 },
      { date: 'Thu', sent: 0, received: 0 },
      { date: 'Fri', sent: 0, received: 0 },
      { date: 'Sat', sent: 0, received: 0 },
      { date: 'Sun', sent: 0, received: 0 },
    ];
  }
};

/**
 * Alternative function to get metrics for a specific instance
 * Note: This is a placeholder that returns empty data
 * since the Evolution API doesn't provide message history endpoints
 */
export const fetchInstanceMetrics = async (instanceName: string): Promise<MessageMetrics[]> => {
  try {
    // This would require a direct API endpoint for fetching message history
    return []; // Return empty array as Evolution API doesn't provide this functionality
  } catch (error) {
    console.error(`Error fetching metrics for instance ${instanceName}:`, error);
    return []; // Return empty array in case of error
  }
};

/**
 * Helper function to get total contacts (placeholder implementation)
 * Note: This is a placeholder as Evolution API doesn't provide contact list endpoints
 */
export const fetchTotalContacts = async (): Promise<number> => {
  try {
    // This would need to be implemented with direct database access
    // or by maintaining a contact list separately
    return 0; // Placeholder value
  } catch (error) {
    console.error('Error fetching total contacts:', error);
    return 0;
  }
};

/**
 * Helper function to get total messages sent/received (placeholder implementation)
 * Note: This is a placeholder as Evolution API doesn't provide message history endpoints
 */
export const fetchTotalMessages = async (): Promise<{ sent: number, received: number }> => {
  try {
    // This would need to be implemented with direct database access
    // or by maintaining message stats separately
    return { sent: 0, received: 0 }; // Placeholder values
  } catch (error) {
    console.error('Error fetching total messages:', error);
    return { sent: 0, received: 0 };
  }
};

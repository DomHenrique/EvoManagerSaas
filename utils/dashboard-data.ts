import { supabase } from '../services/supabase';
import { 
  fetchDashboardStats as fetchEvolutionDashboardStats,
  fetchMessageMetrics,
  fetchTotalContacts,
  fetchTotalMessages
} from '../test-dashboard-data';
import { DashboardStats, MessageMetrics } from '../types';

/**
 * Save dashboard statistics to Supabase
 */
export const saveDashboardStats = async (stats: DashboardStats, userId: string) => {
  try {
    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Insert or update dashboard statistics
    const { data, error, status } = await supabase
      .from('dashboard_stats')
      .upsert({
        user_id: userId || user.id,
        total_instances: stats.totalInstances,
        active_connections: stats.activeConnections,
        total_messages: stats.totalMessages,
        total_contacts: stats.totalContacts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') { // Table doesn't exist
        console.warn('Dashboard stats table does not exist in Supabase:', error.message);
        // Return success without saving to avoid breaking the application
        return { success: true, message: 'Table does not exist' };
      } else {
        console.error('Error saving dashboard stats to Supabase:', error);
        throw error;
      }
    }

    return data;
  } catch (error) {
    console.error('Error saving dashboard stats:', error);
    throw error;
  }
};

/**
 * Save message metrics to Supabase
 */
export const saveMessageMetrics = async (metrics: MessageMetrics[], userId: string) => {
  try {
    // Get current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare metrics data for bulk insert
    const metricsData = metrics.map(metric => ({
      user_id: userId || user.id,
      date: metric.date,
      sent: metric.sent,
      received: metric.received,
      created_at: new Date().toISOString()
    }));

    // Insert message metrics
    const { data, error, status } = await supabase
      .from('message_metrics')
      .upsert(metricsData, { onConflict: ['user_id', 'date'] });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') { // Table doesn't exist
        console.warn('Message metrics table does not exist in Supabase:', error.message);
        // Return success without saving to avoid breaking the application
        return { success: true, message: 'Table does not exist' };
      } else {
        console.error('Error saving message metrics to Supabase:', error);
        throw error;
      }
    }

    return data;
  } catch (error) {
    console.error('Error saving message metrics:', error);
    throw error;
  }
};

/**
 * Fetch dashboard statistics from Evolution API and save to Supabase
 */
export const fetchAndSaveDashboardData = async (userId?: string) => {
  try {
    // Fetch stats from Evolution API
    const stats = await fetchEvolutionDashboardStats();
    
    // If we have a user ID (from session), use it, otherwise Supabase will get it
    const { data: { user } } = await supabase.auth.getUser();
    const actualUserId = userId || user?.id;
    
    if (!actualUserId) {
      throw new Error('User ID is required to save dashboard data');
    }

    // Save to Supabase
    await saveDashboardStats(stats, actualUserId);
    
    // Fetch and save message metrics
    const metrics = await fetchMessageMetrics();
    await saveMessageMetrics(metrics, actualUserId);

    // Also return the data for immediate use
    return { stats, metrics };
  } catch (error) {
    console.error('Error fetching and saving dashboard data:', error);
    throw error;
  }
};

/**
 * Fetch dashboard statistics from Supabase
 */
export const fetchDashboardStatsFromSupabase = async (userId?: string) => {
  try {
    // If no userId provided, get from current session
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      actualUserId = user?.id;
    }

    if (!actualUserId) {
      throw new Error('User ID is required to fetch dashboard data');
    }

    // Fetch from Supabase
    const { data, error, status } = await supabase
      .from('dashboard_stats')
      .select('*')
      .eq('user_id', actualUserId)
      .single(); // Get the latest record for this user

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null;
      } else if (error.code === '42P01' || error.code === 'PGRST205') { // Table doesn't exist
        console.warn('Dashboard stats table does not exist in Supabase:', error.message);
        return null; // Return null to indicate no data is available
      }
      console.error('Error fetching dashboard stats from Supabase:', error);
      throw error;
    }

    return {
      totalInstances: data.total_instances,
      activeConnections: data.active_connections,
      totalMessages: data.total_messages,
      totalContacts: data.total_contacts
    } as DashboardStats;
  } catch (error) {
    console.error('Error fetching dashboard stats from Supabase:', error);
    throw error;
  }
};

/**
 * Fetch message metrics from Supabase
 */
export const fetchMessageMetricsFromSupabase = async (userId?: string, days: number = 7) => {
  try {
    // If no userId provided, get from current session
    let actualUserId = userId;
    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      actualUserId = user?.id;
    }

    if (!actualUserId) {
      throw new Error('User ID is required to fetch message metrics');
    }

    // Calculate the date 'days' ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch from Supabase for the last 7 days (or specified number of days)
    const { data, error, status } = await supabase
      .from('message_metrics')
      .select('*')
      .eq('user_id', actualUserId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') { // Table doesn't exist
        console.warn('Message metrics table does not exist in Supabase:', error.message);
        return []; // Return empty array to indicate no data is available
      }
      console.error('Error fetching message metrics from Supabase:', error);
      throw error;
    }

    // Transform to the expected format
    return data.map(item => ({
      date: item.date, // Using date from the record
      sent: item.sent || 0,
      received: item.received || 0
    })) as MessageMetrics[];
  } catch (error) {
    console.error('Error fetching message metrics from Supabase:', error);
    throw error;
  }
};

/**
 * Fetch all dashboard data (stats and metrics) from Supabase
 * If Supabase tables don't exist, fetch directly from Evolution API
 */
export const fetchAllDashboardData = async (userId?: string) => {
  try {
    // Try to fetch from Supabase first
    const [stats, metrics] = await Promise.all([
      fetchDashboardStatsFromSupabase(userId),
      fetchMessageMetricsFromSupabase(userId)
    ]);

    // If we got data from Supabase, return it
    if (stats && metrics.length > 0) {
      return {
        stats,
        metrics
      };
    }

    // If Supabase data is not available, fetch directly from Evolution API
    console.log('Supabase data not available, fetching directly from Evolution API');
    const { fetchDashboardStats, fetchMessageMetrics } = await import('../test-dashboard-data');

    const evolutionStats = await fetchDashboardStats();
    const evolutionMetrics = await fetchMessageMetrics();

    return {
      stats: evolutionStats,
      metrics: evolutionMetrics
    };
  } catch (error) {
    console.error('Error fetching all dashboard data:', error);

    // Try to fetch directly from Evolution API as fallback
    try {
      console.log('Trying fallback to Evolution API');
      const { fetchDashboardStats, fetchMessageMetrics } = await import('../test-dashboard-data');

      const evolutionStats = await fetchDashboardStats();
      const evolutionMetrics = await fetchMessageMetrics();

      return {
        stats: evolutionStats,
        metrics: evolutionMetrics
      };
    } catch (fallbackError) {
      console.error('All data sources failed:', fallbackError);

      // Return default values in case of error
      return {
        stats: {
          totalInstances: 0,
          activeConnections: 0,
          totalMessages: 0,
          totalContacts: 0
        },
        metrics: []
      };
    }
  }
};
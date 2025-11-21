
import { AppUser } from '../types';
import { supabase, getSession } from './supabase';



export const fetchAppUsers = async (): Promise<AppUser[]> => {


  try {
    // Assumes a 'profiles' table exists in Supabase linked to auth.users
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;
    return data as AppUser[];
  } catch (e) {
    console.error('Error fetching users', e);
    return [];
  }
};

export const getCurrentUserRole = async (): Promise<'admin' | 'user'> => {


  const session = await getSession();
  if (!session?.user) return 'user';

  // Fetch profile to get role
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  return data?.role || 'user';
};

export const createAppUser = async (userData: Omit<AppUser, 'id' | 'last_login' | 'avatar_url'>): Promise<AppUser> => {


  // Note: Creating a user in Supabase Auth usually requires Service Role Key on backend
  // or using an Edge Function if you want to create a user without logging them in.
  // Here we will just insert into the 'profiles' table assuming the auth user is created separately/invited.
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      email: userData.email,
      full_name: userData.full_name,
      role: userData.role,
      status: userData.status
    }])
    .select()
    .single();

  if (error) throw error;
  return data as AppUser;
};

export const deleteAppUser = async (userId: string): Promise<void> => {


  await supabase.from('profiles').delete().eq('id', userId);
};

// --- Instance assignment management ---
export const assignInstanceToUser = async (userId: string, instanceName: string): Promise<void> => {


  await supabase.from('user_instances').upsert([{ user_id: userId, instance_name: instanceName, can_view: true }]);
};

export const revokeInstanceFromUser = async (userId: string, instanceName: string): Promise<void> => {

  await supabase.from('user_instances').delete().match({ user_id: userId, instance_name: instanceName });
};

export const fetchUserInstances = async (userId: string) => {

  const { data, error } = await supabase.from('user_instances').select('*').eq('user_id', userId);
  if (error) {
    console.error('Error fetching user instances', error);
    return [];
  }
  return data;
};

export const fetchUsersWithAssignments = async () => {

  // Join profiles with user_instances
  const { data, error } = await supabase
    .from('profiles')
    .select(`id, email, full_name, role, status, user_instances(*)`);
  if (error) {
    console.error('Error fetching users with assignments', error);
    return [];
  }
  return data;
};
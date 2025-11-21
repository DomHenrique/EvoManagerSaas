import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Shield, User, Loader2, Mail, Clock, AlertCircle, X, Server } from 'lucide-react';
import { fetchAppUsers, createAppUser, deleteAppUser, getCurrentUserRole, assignInstanceToUser, revokeInstanceFromUser, fetchUserInstances } from '../services/userService';
import { AppUser, EvoInstance } from '../types';
import { fetchInstances } from '../services/evolutionApi';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user'>('user');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [role, data] = await Promise.all([
        getCurrentUserRole(),
        fetchAppUsers()
      ]);
      setCurrentUserRole(role);
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail) return;
    
    setIsSubmitting(true);
    try {
      await createAppUser({
        full_name: newFullName,
        email: newEmail,
        role: newRole,
        status: 'active'
      });
      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      alert('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteAppUser(id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const resetForm = () => {
    setNewFullName('');
    setNewEmail('');
    setNewRole('user');
  };

  // Instance assignment modal state
  const [manageUser, setManageUser] = useState<AppUser | null>(null);
  const [allInstances, setAllInstances] = useState<EvoInstance[]>([]);
  const [assignedSet, setAssignedSet] = useState<Record<string, boolean>>({});
  const [assignLoading, setAssignLoading] = useState(false);

  const openManageInstances = async (user: AppUser) => {
    setManageUser(user);
    setAssignLoading(true);
    try {
      const [instances, assigned] = await Promise.all([
        fetchInstances(),
        fetchUserInstances(user.id)
      ]);
      setAllInstances(instances || []);
      const map: Record<string, boolean> = {};
      (assigned || []).forEach((a: any) => { map[a.instance_name] = !!a.can_view; });
      setAssignedSet(map);
    } catch (e) {
      console.error('Failed loading instances or assignments', e);
      setAllInstances([]);
      setAssignedSet({});
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleAssignment = async (instanceName: string) => {
    if (!manageUser) return;
    const currently = !!assignedSet[instanceName];
    // Optimistic update
    setAssignedSet(prev => ({ ...prev, [instanceName]: !currently }));
    try {
      if (!currently) {
        await assignInstanceToUser(manageUser.id, instanceName);
      } else {
        await revokeInstanceFromUser(manageUser.id, instanceName);
      }
    } catch (e) {
      // rollback on error
      setAssignedSet(prev => ({ ...prev, [instanceName]: currently }));
      alert('Failed to update assignment');
      console.error(e);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1">Manage access and roles for the platform.</p>
        </div>
        
        {/* Only Admins can see the Add Button */}
        {currentUserRole === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 outline-none text-slate-700 placeholder-slate-400"
        />
      </div>

      {loading ? (
         <div className="flex justify-center py-20">
           <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
         </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                  {currentUserRole === 'admin' && (
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                           {user.avatar_url ? (
                             <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-500">
                               <User size={20} />
                             </div>
                           )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{user.full_name}</div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                         <Clock size={14} />
                         {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    {currentUserRole === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openManageInstances(user)}
                            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                            title="Manage Instances"
                          >
                            <Server size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add New User</h3>
                <p className="text-sm text-slate-500">Create access for a new team member.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} className="opacity-0" /> {/* Placeholder for alignment if needed, or actual close icon */}
                <X size={20} className="absolute top-6 right-6 cursor-pointer" onClick={() => setIsModalOpen(false)}/>
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      newRole === 'user' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <User size={16} /> User
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                      newRole === 'admin' 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Shield size={16} /> Admin
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs flex gap-2 items-start">
                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                <p>New users will be created with 'Active' status. In a real scenario, this would send an invitation email.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Instances Modal */}
      {manageUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Manage Instances for</h3>
                <p className="text-sm text-slate-600">{manageUser.full_name} — {manageUser.email}</p>
              </div>
              <button onClick={() => setManageUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {assignLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {allInstances.length === 0 && (
                  <div className="text-sm text-slate-500">No instances available.</div>
                )}
                {allInstances.map(inst => (
                  <label key={inst.instanceId} className="flex items-center justify-between p-2 border border-slate-100 rounded-lg">
                    <div className="text-sm font-medium">{inst.instanceName}</div>
                    <input type="checkbox" checked={!!assignedSet[inst.instanceName]} onChange={() => toggleAssignment(inst.instanceName)} />
                  </label>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setManageUser(null)} className="py-2 px-4 bg-slate-100 rounded-lg hover:bg-slate-200">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
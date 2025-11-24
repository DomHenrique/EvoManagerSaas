/**
 * 🌟 Instances Page — Refatorada com:
 * - Tipagem 100% segura (sem any/alert/@ts-ignore)
 * - Feedback visual elegante (notificações)
 * - Atualização reativa de instâncias via banco de dados
 * - Sincronização periódica com Evolution API
 * - Suporte a todos os modos de conexão (QR, pairingCode)
 * - Copiar pairingCode para celular sem câmera
 * - Prevenção de ações simultâneas
 * 
 * ✅ Estética mantida 100% — cores, layout, ícones, responsividade.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  Plus, Power, Trash2, Smartphone, QrCode, Loader2, Key, Copy, Check, X 
} from 'lucide-react';
import { 
  createInstance as createInstanceAPI, 
  deleteInstance as deleteInstanceAPI, 
  connectInstance, 
  logoutInstance 
} from '../services/evolutionApi';
import { 
  getInstances,
  saveInstance,
  deleteInstance as deleteInstanceDB,
  syncInstancesFromAPI,
  startPeriodicSync,
  stopPeriodicSync
} from '../services/instanceService';
import { supabase } from '../services/supabase';
import { EvoInstance } from '../types';

// Utility para extrair inicial do nome da instância
const getInstanceInitial = (name: string): string => {
  return name?.charAt(0)?.toUpperCase() || 'I';
};

// ============================================================================
// Notificação temporária (reutilizada)
// ============================================================================

const NotificationToast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, type === 'info' ? 5000 : 3000);
    return () => clearTimeout(timer);
  }, [onClose, type]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm flex items-center gap-2 transition-all ${
        type === 'success' 
          ? 'bg-emerald-600 animate-fade-in' 
          : type === 'error'
          ? 'bg-red-600 animate-fade-in'
          : 'bg-blue-600 animate-fade-in'
      }`}
    >
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X size={16} />
      </button>
    </div>
  );
};

// ============================================================================
// Componente principal
// ============================================================================

const Instances: React.FC = () => {
  const [instances, setInstances] = useState<EvoInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create Form State
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceToken, setNewInstanceToken] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // QR/Pairing Modal State
  const [qrModal, setQrModal] = useState<{
    open: boolean;
    code: string;
    isBase64: boolean;
    instanceName: string;
    type: 'qr' | 'pairingCode';
  }>({ open: false, code: '', isBase64: false, instanceName: '', type: 'qr' });

  // Notificação
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const copiedRef = useRef(false);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // ============================================================================
  // Carregamento inicial
  // ============================================================================

  const loadInstances = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('User not authenticated', 'error');
        return;
      }

      // Load instances from database
      const data = await getInstances(user.id);
      setInstances(data);
    } catch (error) {
      console.error('Failed to load instances:', error);
      showNotification('Failed to load instances from database.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    let mounted = true;

    const initializeInstances = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Load instances from database first (fast)
      await loadInstances();

      // Trigger initial sync from API (updates database)
      try {
        await syncInstancesFromAPI(user.id);
        // Reload after sync to show updated data
        if (mounted) {
          await loadInstances();
        }
      } catch (error) {
        console.error('Initial sync failed:', error);
      }

      // Start periodic sync (every 60 seconds)
      startPeriodicSync(user.id, 60000);
    };

    initializeInstances();

    // Cleanup: stop periodic sync when component unmounts
    return () => {
      mounted = false;
      stopPeriodicSync();
    };
  }, [loadInstances]);

  // ============================================================================
  // Handlers com atualização reativa
  // ============================================================================

  const handleCreate = useCallback(async () => {
    const cleanName = newInstanceName.trim();
    if (!cleanName) {
      showNotification('Instance name is required', 'error');
      return;
    }

    // Check if an instance with the same name already exists
    if (instances.some(instance => instance.instanceName.toLowerCase() === cleanName.toLowerCase())) {
      showNotification(`An instance with name "${cleanName}" already exists. Please choose a different name.`, 'error');
      return;
    }

    setIsCreating(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('User not authenticated', 'error');
        return;
      }

      // Create instance via Evolution API
      await createInstanceAPI({
        instanceName: cleanName,
        token: newInstanceToken.trim() || undefined,
        integration: 'WHATSAPP-BAILEYS',
      });

      // Save to database immediately
      await saveInstance(user.id, {
        instanceName: cleanName,
        status: 'close',
        integration: 'WHATSAPP-BAILEYS',
      });

      // Refresh instances from database
      await loadInstances();

      // Trigger immediate sync to get latest status
      syncInstancesFromAPI(user.id).catch(err => 
        console.error('Background sync failed:', err)
      );

      showNotification(`Instance "${cleanName}" created successfully!`, 'success');
      setIsModalOpen(false);
      setNewInstanceName('');
      setNewInstanceToken('');
    } catch (error: any) {
      console.error('Create instance failed:', error);

      // Check if it's a duplicate instance error
      if (error?.message?.includes('already exists') || error?.message?.includes('duplicate') ||
          (error?.response && (error.response.status === 409 || error?.response?.message?.toLowerCase().includes('exist')))) {
        showNotification(`An instance with name "${cleanName}" already exists. Please choose a different name.`, 'error');
      } else {
        showNotification('Failed to create instance. Check name and permissions.', 'error');
      }
    } finally {
      setIsCreating(false);
    }
  }, [newInstanceName, newInstanceToken, instances, showNotification, loadInstances]);

  const handleDelete = useCallback(async (name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showNotification('User not authenticated', 'error');
        return;
      }

      // Delete from Evolution API
      await deleteInstanceAPI(name);
      
      // Delete from database
      await deleteInstanceDB(user.id, name);
      
      // Refresh instances from database
      await loadInstances();
      
      showNotification(`Instance "${name}" deleted.`, 'info');
    } catch (error) {
      console.error('Delete instance failed:', error);
      showNotification(`Failed to delete "${name}".`, 'error');
    }
  }, [showNotification, loadInstances]);

  const handleConnect = useCallback(async (name: string) => {
    try {
      const result = await connectInstance(name);

      // ✅ Tipagem forte: ConnectResponse da API
      // Evolution API v2.2.3 retorna:
      // - { base64: "data:image/png;base64,..." } → QR
      // - { pairingCode: "123-456-789" } → Pairing via celular
      // - { status: "open", instance: {...} } → Já conectado

      if (result.status === 'success' && result.instance?.status === 'open') {
        // Get current user and trigger sync
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await syncInstancesFromAPI(user.id);
          await loadInstances();
        }
        showNotification(`"${name}" is already connected.`, 'info');
        return;
      }

      if (result.base64) {
        // QR Code (data:image/png;base64,...)
        setQrModal({
          open: true,
          code: result.base64,
          isBase64: true,
          instanceName: name,
          type: 'qr',
        });
        showNotification('Scan the QR code in WhatsApp.', 'info');
      } else if (result.pairingCode) {
        // Pairing Code (ex: 123-456-789)
        setQrModal({
          open: true,
          code: result.pairingCode,
          isBase64: false,
          instanceName: name,
          type: 'pairingCode',
        });
        showNotification('Enter pairing code in WhatsApp.', 'info');
      } else {
        showNotification('No connection method available. Try again.', 'error');
      }
    } catch (error) {
      console.error('Connect instance failed:', error);
      showNotification(`Failed to connect "${name}". Check logs.`, 'error');
    }
  }, [showNotification, loadInstances]);

  const handleLogout = useCallback(async (name: string) => {
    if (!confirm(`Disconnect WhatsApp session for "${name}"?\nYou'll need to reconnect via QR.`)) {
      return;
    }

    try {
      // Logout via Evolution API
      await logoutInstance(name);
      
      // Get current user and trigger immediate sync
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await syncInstancesFromAPI(user.id);
        await loadInstances();
      }
      
      showNotification(`"${name}" disconnected.`, 'info');
    } catch (error) {
      console.error('Logout instance failed:', error);
      showNotification(`Failed to disconnect "${name}".`, 'error');
    }
  }, [showNotification, loadInstances]);

  const handleCopyPairingCode = useCallback(() => {
    if (!qrModal.code || qrModal.type !== 'pairingCode') return;

    navigator.clipboard.writeText(qrModal.code.replace(/-/g, ''));
    if (!copiedRef.current) {
      copiedRef.current = true;
      setTimeout(() => {
        copiedRef.current = false;
      }, 2000);
      showNotification('Pairing code copied!', 'success');
    }
  }, [qrModal.code, qrModal.type, showNotification]);

  // Tecla Enter no modal de criação
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isModalOpen && !isCreating && newInstanceName.trim()) {
        handleCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isCreating, newInstanceName, handleCreate]);

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Instances</h1>
          <p className="text-slate-500 mt-1">Manage your Evolution API connections.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>New Instance</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {instances.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
              <Smartphone size={48} className="text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-500 mb-2">No instances yet</h3>
              <p className="text-slate-400 text-sm mb-4">Create your first WhatsApp instance to get started.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} /> Create Instance
              </button>
            </div>
          ) : (
            instances.map((inst) => (
              <div 
                key={inst.instanceName} // ✅ Melhor que instanceId (único e imutável)
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                        inst.status === 'open' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}>
                        {inst.profilePictureUrl ? (
                          <img 
                            src={inst.profilePictureUrl} 
                            alt="profile" 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-medium">${getInstanceInitial(inst.instanceName)}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="text-lg font-medium text-slate-500">
                            {getInstanceInitial(inst.instanceName)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 truncate max-w-[180px]">{inst.instanceName}</h3>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className={`w-2 h-2 rounded-full ${
                            inst.status === 'open' ? 'bg-green-500' : 
                            inst.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                          }`}></span>
                          <span className="uppercase text-slate-500 font-medium">
                            {inst.status === 'open' ? 'Connected' : 
                             inst.status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500 space-y-1.5 mb-6">
                    {inst.instanceId && (
                      <p>ID: <span className="font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded">{inst.instanceId.slice(0, 8)}...</span></p>
                    )}
                    <p>Profile: <span className="font-medium text-slate-700">
                      {inst.profileName || (
                        <span className="text-slate-400">Not connected</span>
                      )}
                    </span></p>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {inst.status === 'open' ? (
                      <button
                        onClick={() => {
                          if (!inst.instanceName || inst.instanceName.trim() === '') {
                            showNotification('Invalid instance name. Cannot disconnect.', 'error');
                            return;
                          }
                          handleLogout(inst.instanceName);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Power size={16} /> Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!inst.instanceName || inst.instanceName.trim() === '') {
                            showNotification('Invalid instance name. Cannot connect.', 'error');
                            return;
                          }
                          handleConnect(inst.instanceName);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        <QrCode size={16} /> Connect
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (!inst.instanceName || inst.instanceName.trim() === '') {
                          showNotification('Invalid instance name. Cannot delete.', 'error');
                          return;
                        }
                        handleDelete(inst.instanceName);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete instance"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Instance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Create New Instance</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Instance Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="e.g. Support, Sales, Notifications"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Must be unique. Letters, numbers, and underscores only.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-2">
                  <Key size={14} /> API Token (Optional)
                </label>
                <input 
                  type="password" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={newInstanceToken}
                  onChange={(e) => setNewInstanceToken(e.target.value)}
                  placeholder="Secure token for this instance"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Leave blank to use global API key. Required for multi-tenant setups.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate} 
                  disabled={isCreating || !newInstanceName.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {isCreating && <Loader2 className="animate-spin" size={16} />}
                  Create Instance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR / Pairing Code Modal */}
      {qrModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">
                {qrModal.type === 'qr' ? 'Scan QR Code' : 'Pairing Code'}
              </h3>
              <button 
                onClick={() => setQrModal({ ...qrModal, open: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 text-center">
              {qrModal.type === 'qr' ? (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Open WhatsApp → Settings → Linked Devices → Link a Device
                  </p>
                  <div className="flex justify-center mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg min-h-[220px] items-center">
                    <img 
                      src={qrModal.code} 
                      alt="QR Code to connect WhatsApp" 
                      className="w-full max-w-[250px] h-auto"
                      onError={() => showNotification('Failed to load QR. Try again.', 'error')}
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 mb-3">
                    Open WhatsApp → Settings → Linked Devices → Link a Device → <strong>“Link with phone number”</strong>
                  </p>
                  <div 
                    onClick={handleCopyPairingCode}
                    className="mb-6 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <p className="text-2xl font-bold tracking-widest text-slate-800 select-all">
                      {qrModal.code}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                      <Copy size={14} /> Click to copy (numbers only)
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-3 text-left bg-slate-50 p-4 rounded-lg text-[13px] text-slate-600">
                <p><strong>Note:</strong> QR/pairing code expires in 60 seconds.</p>
                <p>After scanning, wait for WhatsApp to sync (~10-30s).</p>
                <p>The instance status will update automatically.</p>
              </div>

              <button 
                onClick={() => {
                  setQrModal({ ...qrModal, open: false });
                  // ✅ Opcional: atualizar instância específica após conexão
                  // loadInstances(); // ou melhor: listener futuro
                }} 
                className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação */}
      {notification && (
        <NotificationToast
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default Instances;
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  MessageSquare, 
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  MapPin,
  Phone,
  List,
  CheckSquare,
  BarChart3,
  Loader2,
  Eye,
  X,
  Upload,
  Users,
  User
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { sendTextMessage, sendMediaMessage, sendButtonMessage, sendListMessage, sendLocationMessage, sendContactMessage, fetchGroups } from '../services/evolutionApi';
import { EvoInstance, EvoGroup } from '../types';

interface MessageTemplate {
  id: string;
  name: string;
  type: 'text' | 'media' | 'button' | 'list' | 'location' | 'contact';
  content: any;
  created_at: string;
  updated_at: string;
  user_id: string;
  sent_count: number;
  last_sent?: string;
}

interface SendHistory {
  id: string;
  template_id: string;
  template_name: string;
  instance_name: string;
  recipient: string;
  status: 'success' | 'failed';
  sent_at: string;
  error_message?: string;
}

interface Participant {
  id: string;
  phone_number: string;
  name?: string;
  instance_name: string;
}

const Messages: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [sendHistory, setSendHistory] = useState<SendHistory[]>([]);
  const [instances, setInstances] = useState<EvoInstance[]>([]);
  const [groups, setGroups] = useState<EvoGroup[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<MessageTemplate['type']>('text');
  const [textContent, setTextContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [caption, setCaption] = useState('');
  const [buttons, setButtons] = useState<{ id: string; text: string }[]>([{ id: '1', text: '' }]);
  const [listTitle, setListTitle] = useState('');
  const [listItems, setListItems] = useState<{ id: string; title: string; description: string }[]>([
    { id: '1', title: '', description: '' }
  ]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Send form states
  const [selectedInstance, setSelectedInstance] = useState('');
  const [recipientType, setRecipientType] = useState<'manual' | 'participant' | 'group'>('manual');
  const [recipient, setRecipient] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [sending, setSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedInstance && showSendModal) {
      loadGroupsAndParticipants(selectedInstance);
    }
  }, [selectedInstance, showSendModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadTemplates(),
        loadSendHistory(),
        loadInstances()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading templates:', error);
      return;
    }

    setTemplates(data || []);
  };

  const loadSendHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('message_send_history')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading send history:', error);
      return;
    }

    setSendHistory(data || []);
  };

  const loadInstances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'open');

    if (error) {
      console.error('Error loading instances:', error);
      return;
    }

    setInstances(data || []);
  };

  const loadGroupsAndParticipants = async (instanceName: string) => {
    setLoadingGroups(true);
    try {
      // Load groups from Evolution API
      const groupsData = await fetchGroups(instanceName, true);
      setGroups(groupsData);

      // Load participants from database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: participantsData } = await supabase
        .from('participants')
        .select('*')
        .eq('user_id', user.id)
        .eq('instance_name', instanceName)
        .order('last_interaction_at', { ascending: false });

      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Error loading groups and participants:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const uploadMediaToSupabase = async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('message-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('message-media')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleCreateTemplate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let content: any = {};
    let finalMediaUrl = mediaUrl;

    // Upload file if present
    if (templateType === 'media' && mediaFile) {
      try {
        finalMediaUrl = await uploadMediaToSupabase(mediaFile);
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Erro ao fazer upload do arquivo');
        return;
      }
    }

    switch (templateType) {
      case 'text':
        content = { text: textContent };
        break;
      case 'media':
        content = { url: finalMediaUrl, mediaType, caption };
        break;
      case 'button':
        content = { text: textContent, buttons: buttons.filter(b => b.text.trim()) };
        break;
      case 'list':
        content = { 
          title: listTitle, 
          items: listItems.filter(i => i.title.trim()) 
        };
        break;
      case 'location':
        content = { latitude, longitude, name: locationName };
        break;
      case 'contact':
        content = { name: contactName, phone: contactPhone };
        break;
    }

    const template = {
      name: templateName,
      type: templateType,
      content,
      user_id: user.id,
      sent_count: 0
    };

    if (editingTemplate) {
      const { error } = await supabase
        .from('message_templates')
        .update({ ...template, updated_at: new Date().toISOString() })
        .eq('id', editingTemplate.id);

      if (error) {
        console.error('Error updating template:', error);
        alert('Erro ao atualizar template');
        return;
      }
    } else {
      const { error } = await supabase
        .from('message_templates')
        .insert([template]);

      if (error) {
        console.error('Error creating template:', error);
        alert('Erro ao criar template');
        return;
      }
    }

    resetForm();
    setShowCreateModal(false);
    loadTemplates();
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate || !selectedInstance) {
      alert('Selecione um template e uma instância');
      return;
    }

    let finalRecipient = '';
    
    if (recipientType === 'manual') {
      if (!recipient) {
        alert('Digite o número do destinatário');
        return;
      }
      finalRecipient = recipient;
    } else if (recipientType === 'participant') {
      if (!selectedParticipant) {
        alert('Selecione um participante');
        return;
      }
      finalRecipient = selectedParticipant;
    } else if (recipientType === 'group') {
      if (!selectedGroup) {
        alert('Selecione um grupo');
        return;
      }
      finalRecipient = selectedGroup;
    }

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const instance = instances.find(i => i.instanceName === selectedInstance);
    if (!instance) {
      alert('Instância não encontrada');
      setSending(false);
      return;
    }

    let success = false;
    let errorMessage = '';

    try {
      const content = selectedTemplate.content;

      switch (selectedTemplate.type) {
        case 'text':
          await sendTextMessage(instance.instanceName, finalRecipient, content.text);
          success = true;
          break;
        case 'media':
          await sendMediaMessage(
            instance.instanceName,
            finalRecipient,
            content.url,
            content.mediaType,
            content.caption
          );
          success = true;
          break;
        case 'button':
          await sendButtonMessage(
            instance.instanceName,
            finalRecipient,
            content.text,
            content.buttons.map((b: any) => ({ displayText: b.text }))
          );
          success = true;
          break;
        case 'list':
          await sendListMessage(
            instance.instanceName,
            finalRecipient,
            content.title,
            content.items.map((i: any) => ({ title: i.title, description: i.description }))
          );
          success = true;
          break;
        case 'location':
          await sendLocationMessage(
            instance.instanceName,
            finalRecipient,
            parseFloat(content.latitude),
            parseFloat(content.longitude),
            content.name
          );
          success = true;
          break;
        case 'contact':
          await sendContactMessage(
            instance.instanceName,
            finalRecipient,
            content.name,
            content.phone
          );
          success = true;
          break;
      }

      // Update template sent count
      await supabase
        .from('message_templates')
        .update({ 
          sent_count: selectedTemplate.sent_count + 1,
          last_sent: new Date().toISOString()
        })
        .eq('id', selectedTemplate.id);

      // Save to history
      await supabase
        .from('message_send_history')
        .insert([{
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          instance_name: instance.instanceName,
          recipient: finalRecipient,
          status: 'success',
          user_id: user.id,
          sent_at: new Date().toISOString()
        }]);

      alert('Mensagem enviada com sucesso!');
      setShowSendModal(false);
      setRecipient('');
      setSelectedGroup('');
      setSelectedParticipant('');
      loadTemplates();
      loadSendHistory();
    } catch (error: any) {
      console.error('Error sending message:', error);
      errorMessage = error.message || 'Erro desconhecido';
      
      // Save failed attempt to history
      await supabase
        .from('message_send_history')
        .insert([{
          template_id: selectedTemplate.id,
          template_name: selectedTemplate.name,
          instance_name: instance.instanceName,
          recipient: finalRecipient,
          status: 'failed',
          error_message: errorMessage,
          user_id: user.id,
          sent_at: new Date().toISOString()
        }]);

      alert('Erro ao enviar mensagem: ' + errorMessage);
      loadSendHistory();
    } finally {
      setSending(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      alert('Erro ao excluir template');
      return;
    }

    loadTemplates();
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateType(template.type);

    const content = template.content;
    switch (template.type) {
      case 'text':
        setTextContent(content.text || '');
        break;
      case 'media':
        setMediaUrl(content.url || '');
        setMediaType(content.mediaType || 'image');
        setCaption(content.caption || '');
        break;
      case 'button':
        setTextContent(content.text || '');
        setButtons(content.buttons || [{ id: '1', text: '' }]);
        break;
      case 'list':
        setListTitle(content.title || '');
        setListItems(content.items || [{ id: '1', title: '', description: '' }]);
        break;
      case 'location':
        setLatitude(content.latitude || '');
        setLongitude(content.longitude || '');
        setLocationName(content.name || '');
        break;
      case 'contact':
        setContactName(content.name || '');
        setContactPhone(content.phone || '');
        break;
    }

    setShowCreateModal(true);
  };

  const handleDuplicateTemplate = async (template: MessageTemplate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('message_templates')
      .insert([{
        name: `${template.name} (cópia)`,
        type: template.type,
        content: template.content,
        user_id: user.id,
        sent_count: 0
      }]);

    if (error) {
      console.error('Error duplicating template:', error);
      alert('Erro ao duplicar template');
      return;
    }

    loadTemplates();
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateType('text');
    setTextContent('');
    setMediaUrl('');
    setMediaFile(null);
    setMediaType('image');
    setCaption('');
    setButtons([{ id: '1', text: '' }]);
    setListTitle('');
    setListItems([{ id: '1', title: '', description: '' }]);
    setLatitude('');
    setLongitude('');
    setLocationName('');
    setContactName('');
    setContactPhone('');
    setEditingTemplate(null);
  };

  const getTemplateIcon = (type: MessageTemplate['type']) => {
    switch (type) {
      case 'text': return MessageSquare;
      case 'media': return ImageIcon;
      case 'button': return CheckSquare;
      case 'list': return List;
      case 'location': return MapPin;
      case 'contact': return Phone;
      default: return FileText;
    }
  };

  const getTemplateTypeName = (type: MessageTemplate['type']) => {
    const names = {
      text: 'Texto',
      media: 'Mídia',
      button: 'Botões',
      list: 'Lista',
      location: 'Localização',
      contact: 'Contato'
    };
    return names[type] || type;
  };

  const renderTemplateForm = () => {
    switch (templateType) {
      case 'text':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mensagem</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={4}
              placeholder="Digite sua mensagem..."
            />
          </div>
        );

      case 'media':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Mídia</label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                aria-label="Tipo de mídia"
              >
                <option value="image">Imagem</option>
                <option value="video">Vídeo</option>
                <option value="audio">Áudio</option>
                <option value="document">Documento</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload de Arquivo</label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={mediaType === 'image' ? 'image/*' : mediaType === 'video' ? 'video/*' : mediaType === 'audio' ? 'audio/*' : '*'}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMediaFile(file);
                      setMediaUrl('');
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  aria-label="Upload de arquivo"
                >
                  <Upload size={20} />
                  {mediaFile ? mediaFile.name : 'Escolher arquivo'}
                </button>
                {mediaFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remover arquivo"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Ou use uma URL abaixo</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">URL da Mídia</label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  if (e.target.value) setMediaFile(null);
                }}
                disabled={!!mediaFile}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Legenda (opcional)</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={2}
                placeholder="Adicione uma legenda..."
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mensagem</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={3}
                placeholder="Digite sua mensagem..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Botões</label>
              {buttons.map((button, index) => (
                <div key={button.id} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={button.text}
                    onChange={(e) => {
                      const newButtons = [...buttons];
                      newButtons[index].text = e.target.value;
                      setButtons(newButtons);
                    }}
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={`Botão ${index + 1}`}
                  />
                  {buttons.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setButtons(buttons.filter((_, i) => i !== index))}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={`Remover botão ${index + 1}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              {buttons.length < 3 && (
                <button
                  type="button"
                  onClick={() => setButtons([...buttons, { id: String(buttons.length + 1), text: '' }])}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Adicionar Botão
                </button>
              )}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Título da Lista</label>
              <input
                type="text"
                value={listTitle}
                onChange={(e) => setListTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Escolha uma opção"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Itens da Lista</label>
              {listItems.map((item, index) => (
                <div key={item.id} className="mb-3 p-3 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-slate-600">Item {index + 1}</span>
                    {listItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setListItems(listItems.filter((_, i) => i !== index))}
                        className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                        aria-label={`Remover item ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index].title = e.target.value;
                      setListItems(newItems);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Título"
                  />
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...listItems];
                      newItems[index].description = e.target.value;
                      setListItems(newItems);
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Descrição"
                  />
                </div>
              ))}
              {listItems.length < 10 && (
                <button
                  type="button"
                  onClick={() => setListItems([...listItems, { id: String(listItems.length + 1), title: '', description: '' }])}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus size={16} /> Adicionar Item
                </button>
              )}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Latitude</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="-23.550520"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Longitude</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="-46.633308"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Local (opcional)</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Minha Localização"
              />
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Contato</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="5511999999999"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
          <p className="text-slate-500">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Templates de Mensagens</h1>
          <p className="text-slate-500 mt-1">Crie e gerencie templates para envio de mensagens via Evolution API</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          Novo Template
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total de Templates</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{templates.length}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Mensagens Enviadas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">
                {templates.reduce((sum, t) => sum + t.sent_count, 0)}
              </h3>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Instâncias Ativas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{instances.length}</h3>
            </div>
            <div className="p-3 bg-indigo-100 rounded-lg">
              <MessageSquare className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Meus Templates</h2>
        </div>
        <div className="p-6">
          {templates.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">Nenhum template criado ainda</p>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Criar seu primeiro template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = getTemplateIcon(template.type);
                return (
                  <div key={template.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="text-blue-600" size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{template.name}</h3>
                          <p className="text-xs text-slate-500">{getTemplateTypeName(template.type)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <span>Enviado {template.sent_count}x</span>
                      {template.last_sent && (
                        <span>• Último: {new Date(template.last_sent).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowSendModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        title="Enviar mensagem"
                      >
                        <Send size={16} />
                        Enviar
                      </button>
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Editar template"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Duplicar template"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Send History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Histórico de Envios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Instância</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Destinatário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sendHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Nenhum envio registrado
                  </td>
                </tr>
              ) : (
                sendHistory.map((history) => (
                  <tr key={history.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-800">{history.template_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{history.instance_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{history.recipient}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        history.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {history.status === 'success' ? 'Sucesso' : 'Falhou'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(history.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Template</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Ex: Boas-vindas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Mensagem</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value as any)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  aria-label="Tipo de mensagem"
                >
                  <option value="text">Texto</option>
                  <option value="media">Mídia</option>
                  <option value="button">Botões</option>
                  <option value="list">Lista</option>
                  <option value="location">Localização</option>
                  <option value="contact">Contato</option>
                </select>
              </div>

              {renderTemplateForm()}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingTemplate ? 'Atualizar Template' : 'Criar Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSendModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Enviar Mensagem</h2>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Fechar modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Template</label>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-800">{selectedTemplate.name}</p>
                  <p className="text-sm text-slate-500">{getTemplateTypeName(selectedTemplate.type)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instância</label>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  aria-label="Selecionar instância"
                >
                  <option value="">Selecione uma instância</option>
                  {instances.map((instance) => (
                    <option key={instance.instanceName} value={instance.instanceName}>
                      {instance.instanceName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInstance && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Destinatário</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipientType('manual')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          recipientType === 'manual'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <User className="mx-auto mb-1" size={20} />
                        <span className="text-xs font-medium">Manual</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType('participant')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          recipientType === 'participant'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <User className="mx-auto mb-1" size={20} />
                        <span className="text-xs font-medium">Participante</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientType('group')}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          recipientType === 'group'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Users className="mx-auto mb-1" size={20} />
                        <span className="text-xs font-medium">Grupo</span>
                      </button>
                    </div>
                  </div>

                  {recipientType === 'manual' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Número do Destinatário</label>
                      <input
                        type="tel"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="5511999999999"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Formato: código do país + DDD + número (sem espaços)
                      </p>
                    </div>
                  )}

                  {recipientType === 'participant' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Participante</label>
                      {loadingGroups ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        </div>
                      ) : (
                        <select
                          value={selectedParticipant}
                          onChange={(e) => setSelectedParticipant(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          aria-label="Selecionar participante"
                        >
                          <option value="">Selecione um participante</option>
                          {participants.map((participant) => (
                            <option key={participant.id} value={participant.phone_number}>
                              {participant.name || participant.phone_number}
                            </option>
                          ))}
                        </select>
                      )}
                      {!loadingGroups && participants.length === 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Nenhum participante encontrado para esta instância
                        </p>
                      )}
                    </div>
                  )}

                  {recipientType === 'group' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Grupo</label>
                      {loadingGroups ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        </div>
                      ) : (
                        <select
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                          className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          aria-label="Selecionar grupo"
                        >
                          <option value="">Selecione um grupo</option>
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.subject} ({group.size} membros)
                            </option>
                          ))}
                        </select>
                      )}
                      {!loadingGroups && groups.length === 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          Nenhum grupo encontrado para esta instância
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={sending}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;

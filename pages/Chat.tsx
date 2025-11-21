import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCcw } from 'lucide-react';
import { sendToAI } from '../services/aiService';
import { ChatMessage } from '../types';
import { getSession } from '../services/supabase';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', content: 'Hello! I am your AI Assistant connected to the Evolution API. How can I help you today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Session tracking
  const sessionId = useRef(`sess_${Math.random().toString(36).substr(2, 9)}`);
  const userId = useRef('guest');

  useEffect(() => {
    getSession().then(session => {
      if (session?.user) {
        userId.current = session.user.id;
      }
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendToAI({
        user_id: userId.current,
        session_id: sessionId.current,
        message: userMsg.content
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Error connecting to AI Agent.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'system', content: 'Chat history cleared. New session started.', timestamp: new Date() }]);
    sessionId.current = `sess_${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">AI Assistant</h2>
            <p className="text-xs text-slate-500">Powered by Webhook Integration</p>
          </div>
        </div>
        <button onClick={clearChat} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full" title="New Session">
          <RefreshCcw size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : msg.role === 'system' ? 'bg-slate-200 text-slate-500' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] lg:max-w-[60%] p-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : msg.role === 'system'
                ? 'bg-slate-200 text-slate-600 text-center w-full'
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message to the agent..."
            className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-xl text-white transition-all ${isLoading || !input.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg'}`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] text-slate-400">Session ID: {sessionId.current}</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;

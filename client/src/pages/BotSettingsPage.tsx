import React, { useEffect, useState } from 'react';
import { api, BusinessSettings } from '../api/client';
import { Bot, Save, Send, Sparkles, RefreshCw, Check } from 'lucide-react';

export const BotSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<BusinessSettings>({
    botName: 'Apex Assistant',
    greetingMessage: 'Hello! I am your AI assistant. How can we help automate your business or build your next project?',
    systemPrompt: 'You are the knowledgeable sales and support AI for Apex Digital Solutions. Answer visitor questions professionally, explain services (Web Dev, AI SaaS, Cloud Migration), and proactively ask for their email address and project requirements so our human consultants can follow up.',
    knowledgeBaseText: 'Services: Web Development ($3,000+), AI Workflow Automation ($2,000+), Cloud Maintenance ($500/mo). Turnaround is typically 2-4 weeks. We work with clients globally.',
    autoReplyEmail: true,
    qualificationGoal: 'Collect visitor name, email address, company name, estimated budget, and key goals.',
    themeColor: '#4f46e5'
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Test Chat State
  const [testMessages, setTestMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        if (res.data.settings) {
          setSettings(res.data.settings);
          setTestMessages([
            { sender: 'bot', text: res.data.settings.greetingMessage }
          ]);
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    api.put('/settings', settings)
      .then(() => {
        setSaving(false);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      })
      .catch((err) => {
        console.error('Save failed:', err);
        setSaving(false);
      });
  };

  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || testLoading) return;

    const userText = inputMessage;
    setInputMessage('');
    setTestMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setTestLoading(true);

    api.post('/chat/message', {
      message: userText,
      conversationId: 'simulator_test_session'
    })
      .then((res) => {
        setTestMessages((prev) => [...prev, { sender: 'bot', text: res.data.reply }]);
        setTestLoading(false);
      })
      .catch((err) => {
        console.error('Chat test failed:', err);
        setTestLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Bot Studio & Knowledge Base</h2>
        <p className="text-sm text-slate-500">
          Customize your AI chatbot's identity, business facts, pricing guidelines, and qualification goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Editor */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              Bot Parameters
            </h3>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved Successfully!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bot Name</label>
              <input
                type="text"
                value={settings.botName}
                onChange={(e) => setSettings({ ...settings, botName: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Theme Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={settings.themeColor}
                  onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Greeting Message</label>
            <textarea
              rows={2}
              value={settings.greetingMessage}
              onChange={(e) => setSettings({ ...settings, greetingMessage: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              System Prompt & Tone Instructions
            </label>
            <textarea
              rows={3}
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Knowledge Base & Pricing Rules
            </label>
            <textarea
              rows={4}
              value={settings.knowledgeBaseText}
              onChange={(e) => setSettings({ ...settings, knowledgeBaseText: e.target.value })}
              placeholder="Enter facts, service catalog, price tiers, turnaround times..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Lead Qualification Goal</label>
            <input
              type="text"
              value={settings.qualificationGoal}
              onChange={(e) => setSettings({ ...settings, qualificationGoal: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving changes...' : 'Save AI Configuration'}
          </button>
        </form>

        {/* Right: Live Interactive Bot Simulator */}
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden h-[580px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900">Live Simulator Preview</span>
            </div>
            <button
              onClick={() => setTestMessages([{ sender: 'bot', text: settings.greetingMessage }])}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Reset Chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {testMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendTestMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input
              type="text"
              placeholder="Test typing a message (e.g. 'How much for a web app?')"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={testLoading}
              className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  Mail, 
  Settings, 
  Code,
  Bot,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'CRM & Leads', icon: Users },
    { id: 'invoices', label: 'Invoices & Billing', icon: FileText },
    { id: 'conversations', label: 'Live Conversations', icon: MessageSquare },
    { id: 'emails', label: 'Email Automation', icon: Mail },
    { id: 'bot-studio', label: 'AI Bot Studio', icon: Bot },
    { id: 'widget', label: 'Embed Widget', icon: Code },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg tracking-tight">Aura AI</h1>
          <p className="text-xs text-indigo-400 font-medium">Business Automation</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Tenant / User Profile Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Apex Digital</p>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Pro Plan (Active)
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

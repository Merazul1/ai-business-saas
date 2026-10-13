import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LeadsPage } from './pages/LeadsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { EmailAutomationPage } from './pages/EmailAutomationPage';
import { BotSettingsPage } from './pages/BotSettingsPage';
import { WidgetEmbedPage } from './pages/WidgetEmbedPage';
import { Bell, Sparkles, Database } from 'lucide-react';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<any>(null);

  React.useEffect(() => {
    api.get('/db/status')
      .then((res) => setDbStatus(res.data))
      .catch((err) => console.error('Failed to fetch DB status:', err));
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-slate-800 capitalize tracking-wide">
              {currentTab.replace('-', ' ')}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              SaaS Engine v1.0
            </span>

            {/* SQL Server Database Status Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200" title={`Connected to ${dbStatus?.engine || 'SQL Server'} database: ${dbStatus?.database || 'AIBusinessSaaS'} (${dbStatus?.latency || '0ms'})`}>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQL Server: {dbStatus?.database || 'AIBusinessSaaS'}</span>
              <span className="text-[10px] text-emerald-600 bg-emerald-100/70 px-1.5 py-0.2 rounded font-mono">
                {dbStatus?.connected ? 'ONLINE' : 'CONNECTING'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('bot-studio')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Test AI Bot
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200">
              AD
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <Dashboard onNavigate={(t) => setCurrentTab(t)} />}
            {currentTab === 'leads' && <LeadsPage />}
            {currentTab === 'invoices' && <InvoicesPage />}
            {currentTab === 'conversations' && <ConversationsPage />}
            {currentTab === 'emails' && <EmailAutomationPage />}
            {currentTab === 'bot-studio' && <BotSettingsPage />}
            {currentTab === 'widget' && <WidgetEmbedPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

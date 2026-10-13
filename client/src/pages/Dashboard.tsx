import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { StatCard } from '../components/StatCard';
import { Users, DollarSign, MessageSquare, Zap, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';

export const Dashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/overview')
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalLeads: 0,
    conversionRate: '0%',
    totalRevenue: '$0',
    pendingRevenue: '$0',
    totalConversations: 0,
    aiAutomatedRate: '92%'
  };

  const pipeline = data?.pipeline || { NEW: 0, CONTACTED: 0, QUALIFIED: 0, PROPOSAL: 0, CLOSED: 0 };
  const recent = data?.recentConversations || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-300" /> AI Automation Active
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Apex Digital Automation Center</h2>
          <p className="mt-1 text-sm text-indigo-200 leading-relaxed">
            Your AI assistant is actively handling visitor inquiries, auto-qualifying leads, drafting email replies, and preparing client invoices.
          </p>
        </div>
        <div className="absolute right-4 bottom-4 opacity-10 text-white pointer-events-none">
          <Zap className="w-48 h-48" />
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Leads"
          value={metrics.totalLeads}
          change="+18% this wk"
          icon={Users}
          subtext="Auto-captured via AI chat & email"
        />
        <StatCard
          label="Collected Revenue"
          value={metrics.totalRevenue}
          change="+24%"
          icon={DollarSign}
          subtext={`Pending: ${metrics.pendingRevenue}`}
        />
        <StatCard
          label="Conversion Rate"
          value={metrics.conversionRate}
          change="+5.2%"
          icon={ArrowUpRight}
          subtext="Visitor to Qualified Lead"
        />
        <StatCard
          label="AI Automation Rate"
          value={metrics.aiAutomatedRate}
          icon={Zap}
          subtext="Conversations resolved without human triage"
        />
      </div>

      {/* Two Column Layout: Pipeline & Recent Interactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-base">Lead Pipeline</h3>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View CRM →
            </button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'New Inquiries', count: pipeline.NEW, color: 'bg-blue-500' },
              { label: 'Contacted', count: pipeline.CONTACTED, color: 'bg-amber-500' },
              { label: 'Qualified (Ready)', count: pipeline.QUALIFIED, color: 'bg-indigo-500' },
              { label: 'Proposal Sent', count: pipeline.PROPOSAL, color: 'bg-purple-500' },
              { label: 'Closed / Won', count: pipeline.CLOSED, color: 'bg-emerald-500' },
            ].map((stage) => (
              <div key={stage.label}>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>{stage.label}</span>
                  <span className="font-bold">{stage.count}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(8, stage.count * 25))}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Automated Scoring</span>
            <span className="font-semibold text-emerald-600">Active</span>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 text-base">Recent AI Conversations</h3>
            <button
              onClick={() => onNavigate('conversations')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              All Conversations →
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No conversation history yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((conv: any) => (
                <div key={conv.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {conv.summary || `Conversation (${conv.messages.length} messages)`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                          {conv.channel}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {conv.sentiment}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 shrink-0 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {conv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { api } from '../api/client';
import { Mail, Send, CheckCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export const EmailAutomationPage: React.FC = () => {
  const [fromEmail, setFromEmail] = useState('jordan@quantumconsulting.com');
  const [fromName, setFromName] = useState('Jordan Taylor');
  const [subject, setSubject] = useState('Inquiry about automated invoicing & custom AI assistant setup');
  const [body, setBody] = useState(
    'Hi Apex Digital Team,\n\nWe are looking to implement an AI chatbot for our website that can capture client leads and draft initial service proposals. What is your estimated cost and can you start this month?\n\nThanks,\nJordan'
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    api.post('/email/inbound', {
      fromEmail,
      fromName,
      subject,
      body
    })
      .then((res) => {
        setResult(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Email simulation failed:', err);
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Automated Email & Message Replies</h2>
        <p className="text-sm text-slate-500">
          Simulate incoming customer emails or hook your SendGrid / Postmark webhooks to auto-triage inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Email Simulation Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Simulate Inbound Customer Email</h3>
          </div>

          <form onSubmit={handleSimulate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Name</label>
                <input
                  type="text"
                  required
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Email</label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Body</label>
              <textarea
                rows={5}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>Processing AI Triage...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Simulate Inbound & Generate AI Reply
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: AI Triage & Response Preview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Automated Triage & Response Output</h3>
            </div>

            {result ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Category: {result.category}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Urgency: {result.urgency}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Lead Enrolled in CRM
                  </span>
                </div>

                <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
                  <div className="text-xs font-semibold text-slate-700">
                    <span className="text-slate-400">Subject:</span> {result.suggestedSubject}
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                    {result.replyBody}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <Mail className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No email processed yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Click the button on the left to test the automated triage classification and smart reply generation.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Anti-hallucination guardrails and business knowledge injected.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

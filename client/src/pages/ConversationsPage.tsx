import React, { useEffect, useState } from 'react';
import { api, Conversation } from '../api/client';
import { MessageSquare, Bot, User, Clock, CheckCircle2 } from 'lucide-react';

export const ConversationsPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/conversations')
      .then((res) => {
        setConversations(res.data.conversations);
        if (res.data.conversations.length > 0) {
          setSelectedId(res.data.conversations[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching conversations:', err);
        setLoading(false);
      });
  }, []);

  const activeConv = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI & Visitor Conversations</h2>
        <p className="text-sm text-slate-500">
          Review customer interactions, AI responses, captured contact info, and sentiment logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px]">
        {/* Left List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-y-auto divide-y divide-slate-100 shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No conversations recorded yet.</div>
          ) : (
            conversations.map((c) => {
              const active = c.id === selectedId;
              const lastMsg = c.messages[c.messages.length - 1];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    active ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {c.channel}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {lastMsg ? lastMsg.content : 'No messages'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {c.status}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600">
                      {c.sentiment}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Message Transcript */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden">
          {activeConv ? (
            <>
              {/* Transcript Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Session #{activeConv.id}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Channel: {activeConv.channel} • Status: {activeConv.status}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {activeConv.sentiment} Sentiment
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/30">
                {activeConv.messages.map((m) => {
                  const isVisitor = m.senderType === 'VISITOR';
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isVisitor ? 'justify-start' : 'justify-end'}`}
                    >
                      {isVisitor && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs font-bold">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isVisitor
                            ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'
                            : 'bg-indigo-600 text-white rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        <p
                          className={`mt-1 text-[10px] text-right ${
                            isVisitor ? 'text-slate-400' : 'text-indigo-200'
                          }`}
                        >
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!isVisitor && (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation to inspect transcript.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

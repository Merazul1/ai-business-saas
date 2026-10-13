import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, Globe } from 'lucide-react';

export const WidgetEmbedPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const embedScript = `<!-- Aura AI Embed Widget -->
<script 
  src="http://localhost:5000/widget/widget.js" 
  data-tenant-id="tenant_default_demo"
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Website Embed Code</h2>
        <p className="text-sm text-slate-500">
          Paste this single line of code into any website (WordPress, Shopify, Webflow, React) before the closing &lt;/body&gt; tag.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Universal JavaScript Tag</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </>
            )}
          </button>
        </div>

        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
          {embedScript}
        </pre>

        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-800 mb-1">1. Zero Dependencies</p>
            <p className="text-slate-500">Runs directly in vanilla JavaScript without requiring React on visitor sites.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-800 mb-1">2. Multi-Tenant Ready</p>
            <p className="text-slate-500">Each business uses their unique <code>data-tenant-id</code> for isolation.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="font-semibold text-slate-800 mb-1">3. Automated CRM Push</p>
            <p className="text-slate-500">Whenever visitors type their email or phone, leads instantly show in your CRM.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = exports.AnalyticsController = void 0;
const db_1 = require("../config/db");
class AnalyticsController {
    static getOverview(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        const leads = db_1.db.leads.filter((l) => l.tenantId === tenantId);
        const invoices = db_1.db.invoices.filter((i) => i.tenantId === tenantId);
        const conversations = db_1.db.conversations.filter((c) => c.tenantId === tenantId);
        const totalRevenue = invoices
            .filter((i) => i.status === 'PAID')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const pendingRevenue = invoices
            .filter((i) => i.status === 'SENT')
            .reduce((acc, curr) => acc + curr.amount, 0);
        const totalMessages = conversations.reduce((acc, curr) => acc + curr.messages.length, 0);
        const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED' || l.status === 'PROPOSAL' || l.status === 'CLOSED').length;
        const conversionRate = leads.length > 0 ? Math.round((qualifiedLeads / leads.length) * 100) : 0;
        // Lead stage counts
        const pipeline = {
            NEW: leads.filter((l) => l.status === 'NEW').length,
            CONTACTED: leads.filter((l) => l.status === 'CONTACTED').length,
            QUALIFIED: leads.filter((l) => l.status === 'QUALIFIED').length,
            PROPOSAL: leads.filter((l) => l.status === 'PROPOSAL').length,
            CLOSED: leads.filter((l) => l.status === 'CLOSED').length
        };
        return res.json({
            metrics: {
                totalLeads: leads.length,
                qualifiedLeads,
                conversionRate: `${conversionRate}%`,
                totalRevenue: `$${totalRevenue.toLocaleString()}`,
                pendingRevenue: `$${pendingRevenue.toLocaleString()}`,
                totalConversations: conversations.length,
                totalMessages,
                aiAutomatedRate: '92%'
            },
            pipeline,
            recentConversations: conversations.slice(0, 5)
        });
    }
    static getConversations(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        const conversations = db_1.db.conversations.filter((c) => c.tenantId === tenantId);
        return res.json({ conversations });
    }
}
exports.AnalyticsController = AnalyticsController;
class SettingsController {
    static getSettings(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        const settings = db_1.db.businessSettings.find((s) => s.tenantId === tenantId) || db_1.db.businessSettings[0];
        const tenant = db_1.db.tenants.find((t) => t.id === tenantId) || db_1.db.tenants[0];
        return res.json({ settings, tenant });
    }
    static async updateSettings(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        let settings = db_1.db.businessSettings.find((s) => s.tenantId === tenantId);
        if (!settings) {
            settings = {
                id: `settings_${Date.now()}`,
                tenantId,
                botName: req.body.botName || 'Aura AI',
                greetingMessage: req.body.greetingMessage || 'Hello! How can I assist you?',
                systemPrompt: req.body.systemPrompt || '',
                knowledgeBaseText: req.body.knowledgeBaseText || '',
                autoReplyEmail: req.body.autoReplyEmail ?? true,
                qualificationGoal: req.body.qualificationGoal || '',
                themeColor: req.body.themeColor || '#4f46e5'
            };
            db_1.db.businessSettings.push(settings);
        }
        else {
            const { botName, greetingMessage, systemPrompt, knowledgeBaseText, autoReplyEmail, qualificationGoal, themeColor } = req.body;
            if (botName !== undefined)
                settings.botName = botName;
            if (greetingMessage !== undefined)
                settings.greetingMessage = greetingMessage;
            if (systemPrompt !== undefined)
                settings.systemPrompt = systemPrompt;
            if (knowledgeBaseText !== undefined)
                settings.knowledgeBaseText = knowledgeBaseText;
            if (autoReplyEmail !== undefined)
                settings.autoReplyEmail = autoReplyEmail;
            if (qualificationGoal !== undefined)
                settings.qualificationGoal = qualificationGoal;
            if (themeColor !== undefined)
                settings.themeColor = themeColor;
        }
        await db_1.db.persistSettings(settings);
        return res.json({ settings });
    }
}
exports.SettingsController = SettingsController;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const db_1 = require("../config/db");
const openAiService_1 = require("../services/openAiService");
class EmailController {
    /**
     * Process inbound email webhook / test trigger
     */
    static async handleInboundEmail(req, res) {
        try {
            const { tenantId = 'tenant_default_demo', fromEmail, fromName, subject, body } = req.body;
            if (!fromEmail || !body) {
                return res.status(400).json({ error: 'Sender email (fromEmail) and message body are required.' });
            }
            const tenant = db_1.db.tenants.find((t) => t.id === tenantId) || db_1.db.tenants[0];
            // Auto-extract lead if not existing
            let lead = db_1.db.leads.find((l) => l.email.toLowerCase() === fromEmail.toLowerCase());
            if (!lead) {
                lead = {
                    id: `lead_${Date.now()}`,
                    tenantId,
                    name: fromName || fromEmail.split('@')[0],
                    email: fromEmail,
                    status: 'NEW',
                    score: 60,
                    source: 'EMAIL',
                    notes: `Inbound email: "${subject || 'General Inquiry'}"`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                db_1.db.leads.unshift(lead);
                await db_1.db.persistLead(lead);
            }
            // Generate AI auto-reply
            const triage = await openAiService_1.OpenAiService.generateEmailAutoReply(subject || 'Inquiry', body, tenant.name);
            // Save as conversation record
            const conv = {
                id: `conv_email_${Date.now()}`,
                tenantId,
                leadId: lead.id,
                channel: 'EMAIL',
                status: 'RESOLVED',
                sentiment: 'NEUTRAL',
                summary: `Email regarding: ${subject}. Triage category: ${triage.category}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [
                    {
                        id: `msg_in_${Date.now()}`,
                        conversationId: `conv_email_${Date.now()}`,
                        senderType: 'VISITOR',
                        content: `Subject: ${subject}\n\n${body}`,
                        tokensUsed: 0,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: `msg_out_${Date.now()}`,
                        conversationId: `conv_email_${Date.now()}`,
                        senderType: 'AI_BOT',
                        content: `Subject: ${triage.suggestedSubject}\n\n${triage.replyBody}`,
                        tokensUsed: 40,
                        createdAt: new Date().toISOString()
                    }
                ]
            };
            db_1.db.conversations.unshift(conv);
            // Persist to SQL Server
            await db_1.db.persistConversation(conv);
            await db_1.db.persistChatMessage(conv.messages[0]);
            await db_1.db.persistChatMessage(conv.messages[1]);
            return res.json({
                success: true,
                category: triage.category,
                urgency: triage.urgency,
                autoReplySent: true,
                suggestedSubject: triage.suggestedSubject,
                replyBody: triage.replyBody,
                leadId: lead.id
            });
        }
        catch (err) {
            console.error('Email processing error:', err);
            return res.status(500).json({ error: 'Failed to process email automation.' });
        }
    }
}
exports.EmailController = EmailController;

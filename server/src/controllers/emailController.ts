import { Request, Response } from 'express';
import { db } from '../config/db';
import { OpenAiService } from '../services/openAiService';

export class EmailController {
  /**
   * Process inbound email webhook / test trigger
   */
  static async handleInboundEmail(req: Request, res: Response) {
    try {
      const { tenantId = 'tenant_default_demo', fromEmail, fromName, subject, body } = req.body;

      if (!fromEmail || !body) {
        return res.status(400).json({ error: 'Sender email (fromEmail) and message body are required.' });
      }

      const tenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

      // Auto-extract lead if not existing
      let lead = db.leads.find((l) => l.email.toLowerCase() === fromEmail.toLowerCase());
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
        db.leads.unshift(lead);
        await db.persistLead(lead);
      }

      // Generate AI auto-reply
      const triage = await OpenAiService.generateEmailAutoReply(subject || 'Inquiry', body, tenant.name);

      // Save as conversation record
      const conv = {
        id: `conv_email_${Date.now()}`,
        tenantId,
        leadId: lead.id,
        channel: 'EMAIL' as const,
        status: 'RESOLVED' as const,
        sentiment: 'NEUTRAL' as const,
        summary: `Email regarding: ${subject}. Triage category: ${triage.category}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: `msg_in_${Date.now()}`,
            conversationId: `conv_email_${Date.now()}`,
            senderType: 'VISITOR' as const,
            content: `Subject: ${subject}\n\n${body}`,
            tokensUsed: 0,
            createdAt: new Date().toISOString()
          },
          {
            id: `msg_out_${Date.now()}`,
            conversationId: `conv_email_${Date.now()}`,
            senderType: 'AI_BOT' as const,
            content: `Subject: ${triage.suggestedSubject}\n\n${triage.replyBody}`,
            tokensUsed: 40,
            createdAt: new Date().toISOString()
          }
        ]
      };

      db.conversations.unshift(conv);

      // Persist to SQL Server
      await db.persistConversation(conv);
      await db.persistChatMessage(conv.messages[0]);
      await db.persistChatMessage(conv.messages[1]);

      return res.json({
        success: true,
        category: triage.category,
        urgency: triage.urgency,
        autoReplySent: true,
        suggestedSubject: triage.suggestedSubject,
        replyBody: triage.replyBody,
        leadId: lead.id
      });
    } catch (err: any) {
      console.error('Email processing error:', err);
      return res.status(500).json({ error: 'Failed to process email automation.' });
    }
  }
}

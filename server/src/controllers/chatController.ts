import { Request, Response } from 'express';
import { db, ChatMessage, Conversation, Lead } from '../config/db';
import { OpenAiService } from '../services/openAiService';
import { cache } from '../config/redis';

export class ChatController {
  /**
   * Handle incoming message from website visitor embed widget
   */
  static async handleVisitorMessage(req: Request, res: Response) {
    try {
      const { tenantId = 'tenant_default_demo', conversationId, message, visitorInfo } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      // 1. Get or create conversation
      let conv = db.conversations.find((c) => c.id === conversationId);
      const isNew = !conv;

      if (!conv) {
        const newId = conversationId || `conv_${Date.now()}`;
        conv = {
          id: newId,
          tenantId,
          channel: 'WEB_CHAT',
          status: 'OPEN',
          sentiment: 'NEUTRAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: []
        };
        db.conversations.unshift(conv);
      }

      // 2. Record visitor message
      const visitorMsg: ChatMessage = {
        id: `msg_${Date.now()}_u`,
        conversationId: conv.id,
        senderType: 'VISITOR',
        content: message,
        tokensUsed: 0,
        createdAt: new Date().toISOString()
      };
      conv.messages.push(visitorMsg);

      // 3. Lead detection & qualification
      const extracted = OpenAiService.extractLeadInfo(message);
      if (extracted.email) {
        let existingLead = db.leads.find((l) => l.email.toLowerCase() === extracted.email?.toLowerCase());
        if (existingLead) {
          existingLead.score = Math.min(100, existingLead.score + extracted.scoreBonus);
          if (extracted.phone && !existingLead.phone) existingLead.phone = extracted.phone;
          if (extracted.name && !existingLead.name) existingLead.name = extracted.name;
          conv.leadId = existingLead.id;
        } else {
          const newLead: Lead = {
            id: `lead_${Date.now()}`,
            tenantId,
            name: extracted.name || visitorInfo?.name || 'Visitor Lead',
            email: extracted.email,
            phone: extracted.phone || visitorInfo?.phone,
            status: 'NEW',
            score: Math.min(100, 50 + extracted.scoreBonus),
            source: 'CHATBOT',
            notes: `Captured via Chat Widget on ${new Date().toLocaleDateString()}: "${message}"`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.leads.unshift(newLead);
          conv.leadId = newLead.id;
          await db.persistLead(newLead);
        }
      }

      // 4. Load Business Context & Settings
      const settings = db.businessSettings.find((s) => s.tenantId === tenantId) || db.businessSettings[0];

      // 5. Generate AI reply
      const history = conv.messages.slice(-6).map((m) => ({
        role: m.senderType === 'VISITOR' ? ('user' as const) : ('assistant' as const),
        content: m.content
      }));

      const aiResponse = await OpenAiService.generateChatReply({
        userMessage: message,
        conversationHistory: history,
        botName: settings.botName,
        systemPrompt: settings.systemPrompt,
        knowledgeBase: settings.knowledgeBaseText,
        qualificationGoal: settings.qualificationGoal
      });

      // 6. Record Bot message
      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_b`,
        conversationId: conv.id,
        senderType: 'AI_BOT',
        content: aiResponse.reply,
        tokensUsed: aiResponse.tokensUsed,
        createdAt: new Date().toISOString()
      };
      conv.messages.push(botMsg);
      conv.updatedAt = new Date().toISOString();

      // Persist conversation and messages to SQL Server
      await db.persistConversation(conv);
      await db.persistChatMessage(visitorMsg);
      await db.persistChatMessage(botMsg);

      // Cache recent message in Redis for lightning fast resume
      await cache.set(`conv:${conv.id}:lastMessage`, JSON.stringify(botMsg), 'EX', 3600);

      return res.json({
        conversationId: conv.id,
        reply: aiResponse.reply,
        leadCaptured: !!extracted.email,
        timestamp: botMsg.createdAt
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      return res.status(500).json({ error: 'Internal chat server error' });
    }
  }

  /**
   * Get public bot config for widget initialization
   */
  static async getWidgetConfig(req: Request, res: Response) {
    const tenantId = (req.query.tenantId as string) || 'tenant_default_demo';
    const settings = db.businessSettings.find((s) => s.tenantId === tenantId) || db.businessSettings[0];
    const tenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

    return res.json({
      botName: settings.botName,
      greetingMessage: settings.greetingMessage,
      themeColor: settings.themeColor,
      companyName: tenant.name
    });
  }
}

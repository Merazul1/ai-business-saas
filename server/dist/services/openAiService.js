"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const openai_1 = __importDefault(require("openai"));
const env_1 = require("../config/env");
let openaiClient = null;
if (env_1.ENV.OPENAI_API_KEY && env_1.ENV.OPENAI_API_KEY.trim().length > 10) {
    openaiClient = new openai_1.default({ apiKey: env_1.ENV.OPENAI_API_KEY });
}
class OpenAiService {
    /**
     * Generates AI Chatbot reply using OpenAI or built-in intelligent engine
     */
    static async generateChatReply(options) {
        if (openaiClient) {
            try {
                const messages = [
                    {
                        role: 'system',
                        content: `${options.systemPrompt}\n\nBUSINESS KNOWLEDGE BASE:\n${options.knowledgeBase}\n\nGOAL:\n${options.qualificationGoal}\n\nKeep answers concise, helpful, and natural.`
                    },
                    ...options.conversationHistory.map((m) => ({
                        role: m.role,
                        content: m.content
                    })),
                    {
                        role: 'user',
                        content: options.userMessage
                    }
                ];
                const response = await openaiClient.chat.completions.create({
                    model: env_1.ENV.OPENAI_MODEL,
                    messages,
                    temperature: 0.7,
                    max_tokens: 350
                });
                const reply = response.choices[0]?.message?.content || "Thanks for your message! Our team will get back to you shortly.";
                const tokensUsed = response.usage?.total_tokens || 50;
                return { reply, tokensUsed };
            }
            catch (err) {
                console.warn('⚠️ OpenAI API call failed, falling back to local heuristic response:', err.message);
            }
        }
        // Smart Local Heuristic / Demo Fallback
        const lower = options.userMessage.toLowerCase();
        const emailMatch = options.userMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        let reply = `Thank you for reaching out to ${options.botName}! How can we best help your business today?`;
        if (emailMatch) {
            reply = `Thank you! I have recorded your email address (${emailMatch[0]}). One of our team specialists will review your requirements and reach out within 24 hours. Is there anything specific you would like included in our initial estimate?`;
        }
        else if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing') || lower.includes('quote')) {
            reply = `Our project pricing typically starts from $2,000 for AI automation workflows and $3,000 for custom web platforms. What is your email address and preferred timeline so we can prepare a tailored scope for you?`;
        }
        else if (lower.includes('service') || lower.includes('offer') || lower.includes('what do you do')) {
            reply = `We specialize in end-to-end AI automation: website chatbots, automated email responders, workflow integration, and custom SaaS dashboards. What particular business challenge are you looking to automate?`;
        }
        else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            reply = `Hello! I am ${options.botName}. How can I assist you today? Feel free to ask about our services, pricing, or turnaround times!`;
        }
        else {
            reply = `Got it! That sounds like something we can definitely assist with. If you could share your name and email address, our team will review the details and get in touch right away.`;
        }
        return { reply, tokensUsed: 30 };
    }
    /**
     * Extracts lead information from user chat or messages
     */
    static extractLeadInfo(text) {
        const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const phoneMatch = text.match(/(\+?[0-9]{1,3}?[-. ]?\(?[0-9]{2,4}?\)?[-. ]?[0-9]{3,4}[-. ]?[0-9]{3,4})/);
        // Simple heuristic name extractor if phrased as "I am [Name]" or "My name is [Name]"
        const nameMatch = text.match(/(?:i am|my name is|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
        let scoreBonus = 10;
        if (emailMatch)
            scoreBonus += 30;
        if (phoneMatch)
            scoreBonus += 20;
        if (text.toLowerCase().includes('budget') || text.toLowerCase().includes('quote'))
            scoreBonus += 15;
        return {
            email: emailMatch ? emailMatch[1] : undefined,
            phone: phoneMatch ? phoneMatch[1] : undefined,
            name: nameMatch ? nameMatch[1] : undefined,
            scoreBonus
        };
    }
    /**
     * Inbound email classification and auto-reply generator
     */
    static async generateEmailAutoReply(subject, body, companyName) {
        const lower = `${subject} ${body}`.toLowerCase();
        let category = 'GENERAL';
        let urgency = 'MEDIUM';
        if (lower.includes('invoice') || lower.includes('receipt') || lower.includes('payment') || lower.includes('bill')) {
            category = 'BILLING';
            urgency = 'HIGH';
        }
        else if (lower.includes('quote') || lower.includes('demo') || lower.includes('pricing') || lower.includes('proposal') || lower.includes('hire')) {
            category = 'SALES_LEAD';
            urgency = 'HIGH';
        }
        else if (lower.includes('error') || lower.includes('bug') || lower.includes('broken') || lower.includes('help') || lower.includes('issue')) {
            category = 'SUPPORT_TICKET';
            urgency = 'HIGH';
        }
        const suggestedSubject = subject.startsWith('Re:') ? subject : `Re: ${subject} - ${companyName} Automated Update`;
        const replyBody = `Hello,

Thank you for reaching out to ${companyName}.

We have received your message regarding "${subject}". Our automated system has classified your inquiry under [${category}] and assigned it to our specialized team with ${urgency} priority.

A team member will review your details and respond shortly. If you have urgent documents or budget considerations to attach, simply reply to this email.

Best regards,
The ${companyName} Automation Support Team`;
        return {
            category,
            suggestedSubject,
            replyBody,
            urgency
        };
    }
}
exports.OpenAiService = OpenAiService;

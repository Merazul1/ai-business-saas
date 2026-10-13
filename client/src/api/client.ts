import axios from 'axios';

export const api = axios.create({
  baseURL: '/api'
});

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED';
  score: number;
  source: 'CHATBOT' | 'EMAIL' | 'MANUAL';
  notes?: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  tax: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
}

export interface ChatMessage {
  id: string;
  senderType: 'VISITOR' | 'AI_BOT' | 'AGENT';
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  channel: 'WEB_CHAT' | 'EMAIL' | 'SMS';
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary?: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface BusinessSettings {
  botName: string;
  greetingMessage: string;
  systemPrompt: string;
  knowledgeBaseText: string;
  autoReplyEmail: boolean;
  qualificationGoal: string;
  themeColor: string;
}

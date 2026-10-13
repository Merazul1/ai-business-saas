import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { LeadController } from '../controllers/leadController';
import { InvoiceController } from '../controllers/invoiceController';
import { EmailController } from '../controllers/emailController';
import { AnalyticsController, SettingsController } from '../controllers/analyticsController';

export const apiRouter = Router();

// 1. Chat Widget Public & Private Routes
apiRouter.get('/chat/config', ChatController.getWidgetConfig);
apiRouter.post('/chat/message', ChatController.handleVisitorMessage);

// 2. Leads / CRM Routes
apiRouter.get('/leads', LeadController.getLeads);
apiRouter.post('/leads', LeadController.createLead);
apiRouter.put('/leads/:id', LeadController.updateLead);
apiRouter.delete('/leads/:id', LeadController.deleteLead);

// 3. Invoices Routes
apiRouter.get('/invoices', InvoiceController.getInvoices);
apiRouter.post('/invoices', InvoiceController.createInvoice);
apiRouter.get('/invoices/:id/pdf', InvoiceController.downloadPdf);
apiRouter.patch('/invoices/:id/status', InvoiceController.updateStatus);

// 4. Inbound Email & Messaging Automation Routes
apiRouter.post('/email/inbound', EmailController.handleInboundEmail);

// 5. Analytics & Dashboard Routes
apiRouter.get('/analytics/overview', AnalyticsController.getOverview);
apiRouter.get('/conversations', AnalyticsController.getConversations);

// 6. Bot & Business Settings
apiRouter.get('/settings', SettingsController.getSettings);
apiRouter.put('/settings', SettingsController.updateSettings);

// 7. SQL Server Database Health & Sync
import { db } from '../config/db';
apiRouter.get('/db/status', async (req, res) => {
  const status = await db.getStatus();
  res.json(status);
});

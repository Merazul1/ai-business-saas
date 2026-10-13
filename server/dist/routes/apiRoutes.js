"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const leadController_1 = require("../controllers/leadController");
const invoiceController_1 = require("../controllers/invoiceController");
const emailController_1 = require("../controllers/emailController");
const analyticsController_1 = require("../controllers/analyticsController");
exports.apiRouter = (0, express_1.Router)();
// 1. Chat Widget Public & Private Routes
exports.apiRouter.get('/chat/config', chatController_1.ChatController.getWidgetConfig);
exports.apiRouter.post('/chat/message', chatController_1.ChatController.handleVisitorMessage);
// 2. Leads / CRM Routes
exports.apiRouter.get('/leads', leadController_1.LeadController.getLeads);
exports.apiRouter.post('/leads', leadController_1.LeadController.createLead);
exports.apiRouter.put('/leads/:id', leadController_1.LeadController.updateLead);
exports.apiRouter.delete('/leads/:id', leadController_1.LeadController.deleteLead);
// 3. Invoices Routes
exports.apiRouter.get('/invoices', invoiceController_1.InvoiceController.getInvoices);
exports.apiRouter.post('/invoices', invoiceController_1.InvoiceController.createInvoice);
exports.apiRouter.get('/invoices/:id/pdf', invoiceController_1.InvoiceController.downloadPdf);
exports.apiRouter.patch('/invoices/:id/status', invoiceController_1.InvoiceController.updateStatus);
// 4. Inbound Email & Messaging Automation Routes
exports.apiRouter.post('/email/inbound', emailController_1.EmailController.handleInboundEmail);
// 5. Analytics & Dashboard Routes
exports.apiRouter.get('/analytics/overview', analyticsController_1.AnalyticsController.getOverview);
exports.apiRouter.get('/conversations', analyticsController_1.AnalyticsController.getConversations);
// 6. Bot & Business Settings
exports.apiRouter.get('/settings', analyticsController_1.SettingsController.getSettings);
exports.apiRouter.put('/settings', analyticsController_1.SettingsController.updateSettings);
// 7. SQL Server Database Health & Sync
const db_1 = require("../config/db");
exports.apiRouter.get('/db/status', async (req, res) => {
    const status = await db_1.db.getStatus();
    res.json(status);
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const db_1 = require("../config/db");
const invoiceService_1 = require("../services/invoiceService");
class InvoiceController {
    static getInvoices(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        const invoices = db_1.db.invoices.filter((i) => i.tenantId === tenantId);
        return res.json({ invoices });
    }
    static async createInvoice(req, res) {
        const { tenantId = 'tenant_default_demo', leadId, clientName, clientEmail, items, dueDate } = req.body;
        if (!clientName || !clientEmail || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Client name, email, and valid line items are required.' });
        }
        const calculatedItems = items.map((it) => ({
            description: it.description || 'Service',
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)
        }));
        const amount = calculatedItems.reduce((acc, curr) => acc + curr.total, 0);
        const tax = Math.round(amount * 0.08 * 100) / 100; // 8% standard tax
        const nextNum = db_1.db.invoices.length + 1;
        const invoiceNumber = `INV-2026-${String(nextNum).padStart(3, '0')}`;
        const newInvoice = {
            id: `inv_${Date.now()}`,
            tenantId,
            leadId: leadId || 'lead_general',
            invoiceNumber,
            clientName,
            clientEmail,
            amount,
            tax,
            status: 'SENT',
            issueDate: new Date().toISOString(),
            dueDate: dueDate || new Date(Date.now() + 86400000 * 14).toISOString(),
            items: calculatedItems,
            createdAt: new Date().toISOString()
        };
        db_1.db.invoices.unshift(newInvoice);
        await db_1.db.persistInvoice(newInvoice);
        return res.status(201).json({ invoice: newInvoice });
    }
    static async downloadPdf(req, res) {
        const { id } = req.params;
        const invoice = db_1.db.invoices.find((i) => i.id === id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        const tenant = db_1.db.tenants.find((t) => t.id === invoice.tenantId) || db_1.db.tenants[0];
        try {
            const pdfBuffer = await invoiceService_1.InvoiceService.generatePdf(invoice, tenant);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
            return res.send(pdfBuffer);
        }
        catch (err) {
            console.error('PDF error:', err);
            return res.status(500).json({ error: 'Failed to generate invoice PDF.' });
        }
    }
    static async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const invoice = db_1.db.invoices.find((i) => i.id === id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found.' });
        }
        if (['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(status)) {
            invoice.status = status;
            await db_1.db.persistInvoice(invoice);
            return res.json({ invoice });
        }
        return res.status(400).json({ error: 'Invalid status value.' });
    }
}
exports.InvoiceController = InvoiceController;

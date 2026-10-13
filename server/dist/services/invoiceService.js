"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
class InvoiceService {
    /**
     * Generates a PDF binary stream / buffer for an invoice
     */
    static generatePdf(invoice, tenant) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ margin: 50 });
                const buffers = [];
                doc.on('data', (buffer) => buffers.push(buffer));
                doc.on('end', () => resolve(Buffer.concat(buffers)));
                // Header
                doc.fillColor('#1e293b')
                    .fontSize(22)
                    .text(tenant.name, 50, 50)
                    .fontSize(10)
                    .fillColor('#64748b')
                    .text(tenant.companyEmail, 50, 78)
                    .text(`Date Issued: ${new Date(invoice.issueDate).toLocaleDateString()}`, 50, 92);
                // Invoice Number Badge
                doc.fontSize(20)
                    .fillColor('#4f46e5')
                    .text('INVOICE', 400, 50, { align: 'right' })
                    .fontSize(11)
                    .fillColor('#334155')
                    .text(`# ${invoice.invoiceNumber}`, 400, 78, { align: 'right' })
                    .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 400, 92, { align: 'right' })
                    .text(`Status: ${invoice.status}`, 400, 106, { align: 'right' });
                doc.moveTo(50, 130).lineTo(550, 130).strokeColor('#e2e8f0').stroke();
                // Bill To section
                doc.fillColor('#64748b').fontSize(10).text('BILLED TO:', 50, 145);
                doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(invoice.clientName, 50, 160);
                doc.font('Helvetica').fontSize(10).fillColor('#475569').text(invoice.clientEmail, 50, 175);
                // Table Header
                let y = 220;
                doc.rect(50, y, 500, 24).fill('#f8fafc');
                doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
                doc.text('DESCRIPTION', 60, y + 7);
                doc.text('QTY', 330, y + 7, { width: 50, align: 'center' });
                doc.text('RATE ($)', 390, y + 7, { width: 70, align: 'right' });
                doc.text('TOTAL ($)', 470, y + 7, { width: 70, align: 'right' });
                // Table Rows
                y += 30;
                doc.font('Helvetica').fontSize(10).fillColor('#1e293b');
                for (const item of invoice.items) {
                    doc.text(item.description, 60, y, { width: 260 });
                    doc.text(String(item.quantity), 330, y, { width: 50, align: 'center' });
                    doc.text(item.unitPrice.toFixed(2), 390, y, { width: 70, align: 'right' });
                    doc.text(item.total.toFixed(2), 470, y, { width: 70, align: 'right' });
                    y += 24;
                }
                doc.moveTo(50, y + 10).lineTo(550, y + 10).strokeColor('#e2e8f0').stroke();
                y += 20;
                // Subtotal & Total
                const subtotal = invoice.amount;
                const total = subtotal + invoice.tax;
                doc.fillColor('#64748b').text('Subtotal:', 380, y, { width: 80, align: 'right' });
                doc.fillColor('#0f172a').text(`$${subtotal.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
                y += 18;
                doc.fillColor('#64748b').text('Tax (8%):', 380, y, { width: 80, align: 'right' });
                doc.fillColor('#0f172a').text(`$${invoice.tax.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
                y += 22;
                doc.rect(370, y, 180, 30).fill('#eef2ff');
                doc.fillColor('#3730a3').font('Helvetica-Bold').fontSize(12);
                doc.text('Total Due:', 380, y + 9);
                doc.text(`$${total.toFixed(2)}`, 470, y + 9, { width: 70, align: 'right' });
                // Footer Note
                doc.font('Helvetica').fontSize(9).fillColor('#94a3b8')
                    .text('Thank you for your business! Payment is accepted via Bank Wire or Stripe.', 50, 700, {
                    align: 'center',
                    width: 500
                });
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
}
exports.InvoiceService = InvoiceService;

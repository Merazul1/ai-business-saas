"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadController = void 0;
const db_1 = require("../config/db");
class LeadController {
    static getLeads(req, res) {
        const tenantId = req.query.tenantId || 'tenant_default_demo';
        const leads = db_1.db.leads.filter((l) => l.tenantId === tenantId);
        return res.json({ leads });
    }
    static async createLead(req, res) {
        const { tenantId = 'tenant_default_demo', name, email, phone, company, status = 'NEW', score = 50, notes } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required.' });
        }
        const newLead = {
            id: `lead_${Date.now()}`,
            tenantId,
            name,
            email,
            phone,
            company,
            status,
            score: Number(score) || 50,
            source: 'MANUAL',
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        db_1.db.leads.unshift(newLead);
        await db_1.db.persistLead(newLead);
        return res.status(201).json({ lead: newLead });
    }
    static async updateLead(req, res) {
        const { id } = req.params;
        const lead = db_1.db.leads.find((l) => l.id === id);
        if (!lead) {
            return res.status(404).json({ error: 'Lead not found.' });
        }
        const { name, email, phone, company, status, score, notes } = req.body;
        if (name)
            lead.name = name;
        if (email)
            lead.email = email;
        if (phone !== undefined)
            lead.phone = phone;
        if (company !== undefined)
            lead.company = company;
        if (status)
            lead.status = status;
        if (score !== undefined)
            lead.score = Number(score);
        if (notes !== undefined)
            lead.notes = notes;
        lead.updatedAt = new Date().toISOString();
        await db_1.db.persistLead(lead);
        return res.json({ lead });
    }
    static async deleteLead(req, res) {
        const { id } = req.params;
        const index = db_1.db.leads.findIndex((l) => l.id === id);
        if (index === -1) {
            return res.status(404).json({ error: 'Lead not found.' });
        }
        db_1.db.leads.splice(index, 1);
        await db_1.db.deleteLeadFromSql(id);
        return res.json({ success: true, message: 'Lead deleted.' });
    }
}
exports.LeadController = LeadController;

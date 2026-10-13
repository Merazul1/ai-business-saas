"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mssql_1 = __importDefault(require("mssql"));
const env_1 = require("./env");
const sqlConfig = {
    user: env_1.ENV.DB_USER,
    password: env_1.ENV.DB_PASSWORD,
    server: env_1.ENV.DB_SERVER,
    port: env_1.ENV.DB_PORT,
    database: env_1.ENV.DB_NAME,
    options: {
        encrypt: env_1.ENV.DB_ENCRYPT,
        trustServerCertificate: env_1.ENV.DB_TRUST_SERVER_CERTIFICATE
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
class DatabaseStore {
    isConnectedToSqlServer = false;
    sqlServerVersion = '';
    pool = null;
    tenants = [
        {
            id: 'tenant_default_demo',
            name: 'Apex Digital Solutions',
            companyEmail: 'contact@apexdigital.example.com',
            industry: 'B2B Web & SaaS Consulting',
            createdAt: new Date().toISOString()
        }
    ];
    businessSettings = [
        {
            id: 'settings_demo',
            tenantId: 'tenant_default_demo',
            botName: 'Apex Assistant',
            greetingMessage: 'Hello! I am your AI assistant. How can we help automate your business or build your next project?',
            systemPrompt: 'You are the knowledgeable sales and support AI for Apex Digital Solutions. Answer visitor questions professionally, explain services (Web Dev, AI SaaS, Cloud Migration), and proactively ask for their email address and project requirements so our human consultants can follow up.',
            knowledgeBaseText: 'Services: Web Development ($3,000+), AI Workflow Automation ($2,000+), Cloud Maintenance ($500/mo). Turnaround is typically 2-4 weeks. We work with clients globally.',
            autoReplyEmail: true,
            qualificationGoal: 'Collect visitor name, email address, company name, estimated budget, and key goals.',
            themeColor: '#4f46e5'
        }
    ];
    leads = [
        {
            id: 'lead_1',
            tenantId: 'tenant_default_demo',
            name: 'Sarah Jenkins',
            email: 'sarah.j@vertexlogistics.com',
            phone: '+1 (555) 234-5678',
            company: 'Vertex Logistics',
            status: 'QUALIFIED',
            score: 88,
            source: 'CHATBOT',
            notes: 'Interested in AI customer query triage. Budget ~$4,500.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'lead_2',
            tenantId: 'tenant_default_demo',
            name: 'Michael Chen',
            email: 'm.chen@novapharma.org',
            phone: '+1 (555) 876-5432',
            company: 'Nova Pharma',
            status: 'NEW',
            score: 65,
            source: 'EMAIL',
            notes: 'Sent inquiry asking about automated invoice dispatch integration.',
            createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'lead_3',
            tenantId: 'tenant_default_demo',
            name: 'Elena Rostova',
            email: 'elena@craftdesign.co',
            company: 'Craft Design Studio',
            status: 'PROPOSAL',
            score: 95,
            source: 'CHATBOT',
            notes: 'Proposal sent for website + customer portal bot.',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
    ];
    conversations = [];
    invoices = [];
    /**
     * Initializes connection to Microsoft SQL Server and syncs persistent tables
     */
    async init() {
        try {
            this.pool = await new mssql_1.default.ConnectionPool(sqlConfig).connect();
            this.isConnectedToSqlServer = true;
            const verResult = await this.pool.request().query('SELECT @@VERSION AS ver');
            this.sqlServerVersion = verResult.recordset[0]?.ver?.split('\n')[0] || 'Microsoft SQL Server';
            console.log(`✅ [SQL Server] Connected successfully to "${env_1.ENV.DB_NAME}" on ${env_1.ENV.DB_SERVER}:${env_1.ENV.DB_PORT}`);
            console.log(`ℹ️ [SQL Server] Version: ${this.sqlServerVersion}`);
            // Sync state from SQL Server into memory
            await this.syncFromSqlServer();
        }
        catch (err) {
            this.isConnectedToSqlServer = false;
            console.warn(`⚠️ [SQL Server] Connection error: ${err.message}. Operating in memory fallback.`);
        }
    }
    /**
     * Loads live rows from Microsoft SQL Server
     */
    async syncFromSqlServer() {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            // 1. Tenants
            const tenantsRes = await this.pool.request().query('SELECT * FROM tenants');
            if (tenantsRes.recordset.length > 0) {
                this.tenants = tenantsRes.recordset.map((r) => ({
                    id: r.id,
                    name: r.name,
                    companyEmail: r.companyEmail,
                    industry: r.industry || 'General',
                    createdAt: new Date(r.createdAt).toISOString()
                }));
            }
            // 2. Business Settings
            const settingsRes = await this.pool.request().query('SELECT * FROM business_settings');
            if (settingsRes.recordset.length > 0) {
                this.businessSettings = settingsRes.recordset.map((r) => ({
                    id: r.id,
                    tenantId: r.tenantId,
                    botName: r.botName,
                    greetingMessage: r.greetingMessage,
                    systemPrompt: r.systemPrompt,
                    knowledgeBaseText: r.knowledgeBaseText,
                    autoReplyEmail: Boolean(r.autoReplyEmail),
                    qualificationGoal: r.qualificationGoal,
                    themeColor: r.themeColor
                }));
            }
            // 3. Leads
            const leadsRes = await this.pool.request().query('SELECT * FROM leads ORDER BY createdAt DESC');
            if (leadsRes.recordset.length > 0) {
                this.leads = leadsRes.recordset.map((r) => ({
                    id: r.id,
                    tenantId: r.tenantId,
                    name: r.name,
                    email: r.email,
                    phone: r.phone || undefined,
                    company: r.company || undefined,
                    status: r.status,
                    score: r.score,
                    source: r.source,
                    notes: r.notes || undefined,
                    createdAt: new Date(r.createdAt).toISOString(),
                    updatedAt: new Date(r.updatedAt).toISOString()
                }));
            }
            // 4. Invoices
            const invoicesRes = await this.pool.request().query('SELECT * FROM invoices ORDER BY createdAt DESC');
            if (invoicesRes.recordset.length > 0) {
                this.invoices = invoicesRes.recordset.map((r) => {
                    let items = [];
                    try {
                        items = JSON.parse(r.itemsJson);
                    }
                    catch {
                        items = [];
                    }
                    return {
                        id: r.id,
                        tenantId: r.tenantId,
                        leadId: r.leadId,
                        invoiceNumber: r.invoiceNumber,
                        clientName: r.clientName,
                        clientEmail: r.clientEmail,
                        amount: r.amount,
                        tax: r.tax,
                        status: r.status,
                        issueDate: new Date(r.issueDate).toISOString(),
                        dueDate: new Date(r.dueDate).toISOString(),
                        items,
                        createdAt: new Date(r.createdAt).toISOString()
                    };
                });
            }
            // 5. Conversations & Messages
            const convsRes = await this.pool.request().query('SELECT * FROM conversations ORDER BY createdAt DESC');
            const msgsRes = await this.pool.request().query('SELECT * FROM chat_messages ORDER BY createdAt ASC');
            const messagesMap = new Map();
            for (const m of msgsRes.recordset) {
                const arr = messagesMap.get(m.conversationId) || [];
                arr.push({
                    id: m.id,
                    conversationId: m.conversationId,
                    senderType: m.senderType,
                    content: m.content,
                    tokensUsed: m.tokensUsed,
                    createdAt: new Date(m.createdAt).toISOString()
                });
                messagesMap.set(m.conversationId, arr);
            }
            if (convsRes.recordset.length > 0) {
                this.conversations = convsRes.recordset.map((r) => ({
                    id: r.id,
                    tenantId: r.tenantId,
                    leadId: r.leadId || undefined,
                    channel: r.channel,
                    status: r.status,
                    sentiment: r.sentiment,
                    summary: r.summary || undefined,
                    createdAt: new Date(r.createdAt).toISOString(),
                    updatedAt: new Date(r.updatedAt).toISOString(),
                    messages: messagesMap.get(r.id) || []
                }));
            }
            console.log(`📊 [SQL Server] Synced: ${this.leads.length} leads, ${this.invoices.length} invoices, ${this.conversations.length} conversations.`);
        }
        catch (err) {
            console.error('❌ [SQL Server] Error during sync:', err.message);
        }
    }
    /**
     * Persist or update a Lead in SQL Server
     */
    async persistLead(lead) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), lead.id);
            req.input('tenantId', mssql_1.default.NVarChar(50), lead.tenantId);
            req.input('name', mssql_1.default.NVarChar(255), lead.name);
            req.input('email', mssql_1.default.NVarChar(255), lead.email);
            req.input('phone', mssql_1.default.NVarChar(50), lead.phone || null);
            req.input('company', mssql_1.default.NVarChar(255), lead.company || null);
            req.input('status', mssql_1.default.NVarChar(50), lead.status);
            req.input('score', mssql_1.default.Int, lead.score);
            req.input('source', mssql_1.default.NVarChar(50), lead.source);
            req.input('notes', mssql_1.default.NVarChar(mssql_1.default.MAX), lead.notes || null);
            await req.query(`
        IF EXISTS (SELECT 1 FROM leads WHERE id = @id)
        BEGIN
          UPDATE leads
          SET name = @name, email = @email, phone = @phone, company = @company,
              status = @status, score = @score, source = @source, notes = @notes,
              updatedAt = SYSDATETIME()
          WHERE id = @id
        END
        ELSE
        BEGIN
          INSERT INTO leads (id, tenantId, name, email, phone, company, status, score, source, notes)
          VALUES (@id, @tenantId, @name, @email, @phone, @company, @status, @score, @source, @notes)
        END
      `);
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to persist lead:', err.message);
        }
    }
    /**
     * Delete Lead in SQL Server
     */
    async deleteLeadFromSql(id) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), id);
            await req.query('DELETE FROM leads WHERE id = @id');
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to delete lead:', err.message);
        }
    }
    /**
     * Persist Conversation in SQL Server
     */
    async persistConversation(conv) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), conv.id);
            req.input('tenantId', mssql_1.default.NVarChar(50), conv.tenantId);
            req.input('leadId', mssql_1.default.NVarChar(50), conv.leadId || null);
            req.input('channel', mssql_1.default.NVarChar(50), conv.channel);
            req.input('status', mssql_1.default.NVarChar(50), conv.status);
            req.input('sentiment', mssql_1.default.NVarChar(50), conv.sentiment);
            req.input('summary', mssql_1.default.NVarChar(mssql_1.default.MAX), conv.summary || null);
            await req.query(`
        IF EXISTS (SELECT 1 FROM conversations WHERE id = @id)
        BEGIN
          UPDATE conversations
          SET status = @status, sentiment = @sentiment, summary = @summary, leadId = @leadId, updatedAt = SYSDATETIME()
          WHERE id = @id
        END
        ELSE
        BEGIN
          INSERT INTO conversations (id, tenantId, leadId, channel, status, sentiment, summary)
          VALUES (@id, @tenantId, @leadId, @channel, @status, @sentiment, @summary)
        END
      `);
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to persist conversation:', err.message);
        }
    }
    /**
     * Persist Chat Message in SQL Server
     */
    async persistChatMessage(msg) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), msg.id);
            req.input('conversationId', mssql_1.default.NVarChar(50), msg.conversationId);
            req.input('senderType', mssql_1.default.NVarChar(50), msg.senderType);
            req.input('content', mssql_1.default.NVarChar(mssql_1.default.MAX), msg.content);
            req.input('tokensUsed', mssql_1.default.Int, msg.tokensUsed || 0);
            await req.query(`
        INSERT INTO chat_messages (id, conversationId, senderType, content, tokensUsed)
        VALUES (@id, @conversationId, @senderType, @content, @tokensUsed)
      `);
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to persist chat message:', err.message);
        }
    }
    /**
     * Persist Invoice in SQL Server
     */
    async persistInvoice(inv) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), inv.id);
            req.input('tenantId', mssql_1.default.NVarChar(50), inv.tenantId);
            req.input('leadId', mssql_1.default.NVarChar(50), inv.leadId);
            req.input('invoiceNumber', mssql_1.default.NVarChar(100), inv.invoiceNumber);
            req.input('clientName', mssql_1.default.NVarChar(255), inv.clientName);
            req.input('clientEmail', mssql_1.default.NVarChar(255), inv.clientEmail);
            req.input('amount', mssql_1.default.Float, inv.amount);
            req.input('tax', mssql_1.default.Float, inv.tax);
            req.input('status', mssql_1.default.NVarChar(50), inv.status);
            req.input('dueDate', mssql_1.default.DateTime2, new Date(inv.dueDate));
            req.input('itemsJson', mssql_1.default.NVarChar(mssql_1.default.MAX), JSON.stringify(inv.items));
            await req.query(`
        IF EXISTS (SELECT 1 FROM invoices WHERE id = @id)
        BEGIN
          UPDATE invoices
          SET status = @status, updatedAt = SYSDATETIME()
          WHERE id = @id
        END
        ELSE
        BEGIN
          INSERT INTO invoices (id, tenantId, leadId, invoiceNumber, clientName, clientEmail, amount, tax, status, dueDate, itemsJson)
          VALUES (@id, @tenantId, @leadId, @invoiceNumber, @clientName, @clientEmail, @amount, @tax, @status, @dueDate, @itemsJson)
        END
      `);
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to persist invoice:', err.message);
        }
    }
    /**
     * Persist Business Settings in SQL Server
     */
    async persistSettings(settings) {
        if (!this.pool || !this.isConnectedToSqlServer)
            return;
        try {
            const req = this.pool.request();
            req.input('id', mssql_1.default.NVarChar(50), settings.id);
            req.input('tenantId', mssql_1.default.NVarChar(50), settings.tenantId);
            req.input('botName', mssql_1.default.NVarChar(255), settings.botName);
            req.input('greetingMessage', mssql_1.default.NVarChar(mssql_1.default.MAX), settings.greetingMessage);
            req.input('systemPrompt', mssql_1.default.NVarChar(mssql_1.default.MAX), settings.systemPrompt);
            req.input('knowledgeBaseText', mssql_1.default.NVarChar(mssql_1.default.MAX), settings.knowledgeBaseText);
            req.input('autoReplyEmail', mssql_1.default.Bit, settings.autoReplyEmail ? 1 : 0);
            req.input('qualificationGoal', mssql_1.default.NVarChar(mssql_1.default.MAX), settings.qualificationGoal);
            req.input('themeColor', mssql_1.default.NVarChar(50), settings.themeColor);
            await req.query(`
        IF EXISTS (SELECT 1 FROM business_settings WHERE tenantId = @tenantId)
        BEGIN
          UPDATE business_settings
          SET botName = @botName, greetingMessage = @greetingMessage, systemPrompt = @systemPrompt,
              knowledgeBaseText = @knowledgeBaseText, autoReplyEmail = @autoReplyEmail,
              qualificationGoal = @qualificationGoal, themeColor = @themeColor, updatedAt = SYSDATETIME()
          WHERE tenantId = @tenantId
        END
        ELSE
        BEGIN
          INSERT INTO business_settings (id, tenantId, botName, greetingMessage, systemPrompt, knowledgeBaseText, autoReplyEmail, qualificationGoal, themeColor)
          VALUES (@id, @tenantId, @botName, @greetingMessage, @systemPrompt, @knowledgeBaseText, @autoReplyEmail, @qualificationGoal, @themeColor)
        END
      `);
        }
        catch (err) {
            console.error('❌ [SQL Server] Failed to persist settings:', err.message);
        }
    }
    /**
     * Returns live database status and statistics
     */
    async getStatus() {
        let pingMs = 0;
        const start = Date.now();
        if (this.pool && this.isConnectedToSqlServer) {
            try {
                await this.pool.request().query('SELECT 1');
                pingMs = Date.now() - start;
            }
            catch {
                this.isConnectedToSqlServer = false;
            }
        }
        return {
            connected: this.isConnectedToSqlServer,
            engine: 'Microsoft SQL Server',
            database: env_1.ENV.DB_NAME,
            server: `${env_1.ENV.DB_SERVER}:${env_1.ENV.DB_PORT}`,
            user: env_1.ENV.DB_USER,
            version: this.sqlServerVersion || 'SQL Server 2025',
            latency: `${pingMs}ms`,
            tables: {
                leads: this.leads.length,
                conversations: this.conversations.length,
                invoices: this.invoices.length,
                tenants: this.tenants.length
            }
        };
    }
}
exports.db = new DatabaseStore();

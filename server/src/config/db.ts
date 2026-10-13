import sql from 'mssql';
import { Pool as PgPool } from 'pg';
import { ENV } from './env';

export interface Tenant {
  id: string;
  name: string;
  companyEmail: string;
  industry: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'CLOSED';
  score: number;
  source: 'CHATBOT' | 'EMAIL' | 'MANUAL';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'VISITOR' | 'AI_BOT' | 'AGENT';
  content: string;
  tokensUsed: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  leadId?: string;
  channel: 'WEB_CHAT' | 'EMAIL' | 'SMS';
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  leadId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  tax: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface BusinessSettings {
  id: string;
  tenantId: string;
  botName: string;
  greetingMessage: string;
  systemPrompt: string;
  knowledgeBaseText: string;
  autoReplyEmail: boolean;
  qualificationGoal: string;
  themeColor: string;
}

class DatabaseStore {
  public dbEngine: 'SQL_SERVER' | 'POSTGRES' | 'MEMORY' = 'MEMORY';
  public isConnected = false;
  public dbVersion = '';
  public activeDbName = '';

  // SQL Server Pool
  public sqlPool: sql.ConnectionPool | null = null;
  // PostgreSQL Pool (for free cloud DBs like Supabase / Neon / Render Postgres)
  public pgPool: PgPool | null = null;

  public tenants: Tenant[] = [
    {
      id: 'tenant_default_demo',
      name: 'Apex Digital Solutions',
      companyEmail: 'contact@apexdigital.example.com',
      industry: 'B2B Web & SaaS Consulting',
      createdAt: new Date().toISOString()
    }
  ];

  public businessSettings: BusinessSettings[] = [
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

  public leads: Lead[] = [
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

  public conversations: Conversation[] = [];
  public invoices: Invoice[] = [];

  /**
   * Initializes database connection automatically detecting free cloud Postgres or SQL Server
   */
  async init(): Promise<void> {
    const dbUrl = (ENV.DATABASE_URL || '').trim();

    // 1. Check for Free Cloud PostgreSQL (Neon, Supabase, Render Postgres)
    if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
      try {
        this.pgPool = new PgPool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false }
        });
        const client = await this.pgPool.connect();
        const ver = await client.query('SELECT version()');
        client.release();

        this.dbEngine = 'POSTGRES';
        this.isConnected = true;
        this.activeDbName = dbUrl.split('/').pop()?.split('?')[0] || 'postgres';
        this.dbVersion = ver.rows[0]?.version?.split(' ')[0] || 'PostgreSQL';

        console.log(`✅ [PostgreSQL] Connected to free cloud DB: ${this.activeDbName}`);
        await this.initPostgresSchema();
        await this.syncFromPostgres();
        return;
      } catch (err: any) {
        console.warn(`⚠️ [PostgreSQL] Failed connecting: ${err.message}. Trying SQL Server...`);
      }
    }

    // 2. Check for SQL Server (Local SQL Server or Azure SQL Database)
    try {
      const sqlConfig: sql.config = {
        user: ENV.DB_USER,
        password: ENV.DB_PASSWORD,
        server: ENV.DB_SERVER,
        port: ENV.DB_PORT,
        database: ENV.DB_NAME,
        options: {
          encrypt: ENV.DB_ENCRYPT,
          trustServerCertificate: ENV.DB_TRUST_SERVER_CERTIFICATE
        },
        pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
      };

      this.sqlPool = await new sql.ConnectionPool(sqlConfig).connect();
      this.dbEngine = 'SQL_SERVER';
      this.isConnected = true;
      this.activeDbName = ENV.DB_NAME;

      const verResult = await this.sqlPool.request().query('SELECT @@VERSION AS ver');
      this.dbVersion = verResult.recordset[0]?.ver?.split('\n')[0] || 'Microsoft SQL Server';

      console.log(`✅ [SQL Server] Connected successfully to "${ENV.DB_NAME}" on ${ENV.DB_SERVER}:${ENV.DB_PORT}`);
      await this.syncFromSqlServer();
      return;
    } catch (err: any) {
      console.warn(`⚠️ [SQL Server] Connection error: ${err.message}. Operating in memory fallback.`);
    }

    // 3. Fallback to In-Memory
    this.dbEngine = 'MEMORY';
    this.isConnected = false;
    this.activeDbName = 'In-Memory Cache';
    console.log('ℹ️ [Database] Running with zero-dependency in-memory dev database.');
  }

  // --------------------------------------------------------------------------
  // PostgreSQL Methods (for Free Cloud DBs like Neon & Supabase)
  // --------------------------------------------------------------------------
  private async initPostgresSchema(): Promise<void> {
    if (!this.pgPool) return;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          company_email VARCHAR(255) NOT NULL,
          industry VARCHAR(100) DEFAULT 'General',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS business_settings (
          id VARCHAR(50) PRIMARY KEY,
          tenant_id VARCHAR(50) NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
          bot_name VARCHAR(255) DEFAULT 'Aura AI',
          greeting_message TEXT NOT NULL,
          system_prompt TEXT NOT NULL,
          knowledge_base_text TEXT NOT NULL,
          auto_reply_email BOOLEAN DEFAULT TRUE,
          qualification_goal TEXT NOT NULL,
          theme_color VARCHAR(50) DEFAULT '#4f46e5'
        );
        CREATE TABLE IF NOT EXISTS leads (
          id VARCHAR(50) PRIMARY KEY,
          tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          company VARCHAR(255),
          status VARCHAR(50) DEFAULT 'NEW',
          score INT DEFAULT 50,
          source VARCHAR(50) DEFAULT 'CHATBOT',
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS conversations (
          id VARCHAR(50) PRIMARY KEY,
          tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
          channel VARCHAR(50) DEFAULT 'WEB_CHAT',
          status VARCHAR(50) DEFAULT 'OPEN',
          sentiment VARCHAR(50) DEFAULT 'NEUTRAL',
          summary TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(50) PRIMARY KEY,
          conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          sender_type VARCHAR(50) NOT NULL,
          content TEXT NOT NULL,
          tokens_used INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(50) PRIMARY KEY,
          tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          lead_id VARCHAR(50),
          invoice_number VARCHAR(100) NOT NULL UNIQUE,
          client_name VARCHAR(255) NOT NULL,
          client_email VARCHAR(255) NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          tax DOUBLE PRECISION DEFAULT 0.0,
          status VARCHAR(50) DEFAULT 'DRAFT',
          issue_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP WITH TIME ZONE NOT NULL,
          items_json TEXT NOT NULL
        );
      `);

      // Seed tenant if missing
      await this.pgPool.query(`
        INSERT INTO tenants (id, name, company_email, industry)
        VALUES ('tenant_default_demo', 'Apex Digital Solutions', 'contact@apexdigital.example.com', 'B2B Web & SaaS Consulting')
        ON CONFLICT (id) DO NOTHING;
      `);
    } catch (err: any) {
      console.warn('Postgres schema notice:', err.message);
    }
  }

  private async syncFromPostgres(): Promise<void> {
    if (!this.pgPool) return;
    try {
      const leadsRes = await this.pgPool.query('SELECT * FROM leads ORDER BY created_at DESC');
      if (leadsRes.rows.length > 0) {
        this.leads = leadsRes.rows.map((r: any) => ({
          id: r.id,
          tenantId: r.tenant_id,
          name: r.name,
          email: r.email,
          phone: r.phone || undefined,
          company: r.company || undefined,
          status: r.status,
          score: r.score,
          source: r.source,
          notes: r.notes || undefined,
          createdAt: new Date(r.created_at).toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      const invRes = await this.pgPool.query('SELECT * FROM invoices ORDER BY issue_date DESC');
      if (invRes.rows.length > 0) {
        this.invoices = invRes.rows.map((r: any) => ({
          id: r.id,
          tenantId: r.tenant_id,
          leadId: r.lead_id,
          invoiceNumber: r.invoice_number,
          clientName: r.client_name,
          clientEmail: r.client_email,
          amount: Number(r.amount),
          tax: Number(r.tax),
          status: r.status,
          issueDate: new Date(r.issue_date).toISOString(),
          dueDate: new Date(r.due_date).toISOString(),
          items: JSON.parse(r.items_json || '[]'),
          createdAt: new Date(r.issue_date).toISOString()
        }));
      }
    } catch (err: any) {
      console.error('Error syncing Postgres:', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // SQL Server Methods (Local or Free Azure SQL)
  // --------------------------------------------------------------------------
  private async syncFromSqlServer(): Promise<void> {
    if (!this.sqlPool) return;
    try {
      const tenantsRes = await this.sqlPool.request().query('SELECT * FROM tenants');
      if (tenantsRes.recordset.length > 0) {
        this.tenants = tenantsRes.recordset.map((r: any) => ({
          id: r.id,
          name: r.name,
          companyEmail: r.companyEmail,
          industry: r.industry || 'General',
          createdAt: new Date(r.createdAt).toISOString()
        }));
      }

      const leadsRes = await this.sqlPool.request().query('SELECT * FROM leads ORDER BY createdAt DESC');
      if (leadsRes.recordset.length > 0) {
        this.leads = leadsRes.recordset.map((r: any) => ({
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

      const invoicesRes = await this.sqlPool.request().query('SELECT * FROM invoices ORDER BY createdAt DESC');
      if (invoicesRes.recordset.length > 0) {
        this.invoices = invoicesRes.recordset.map((r: any) => {
          let items: InvoiceItem[] = [];
          try { items = JSON.parse(r.itemsJson); } catch {}
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
    } catch (err: any) {
      console.error('❌ [SQL Server] Sync error:', err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Universal Persistence Layer (Writes to SQL Server or Postgres)
  // --------------------------------------------------------------------------
  async persistLead(lead: Lead): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO leads (id, tenant_id, name, email, phone, company, status, score, source, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO UPDATE
           SET name = $3, email = $4, phone = $5, company = $6, status = $7, score = $8, source = $9, notes = $10`,
          [lead.id, lead.tenantId, lead.name, lead.email, lead.phone || null, lead.company || null, lead.status, lead.score, lead.source, lead.notes || null]
        );
      } catch (err: any) {
        console.error('Postgres persist lead error:', err.message);
      }
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('id', sql.NVarChar(50), lead.id);
        req.input('tenantId', sql.NVarChar(50), lead.tenantId);
        req.input('name', sql.NVarChar(255), lead.name);
        req.input('email', sql.NVarChar(255), lead.email);
        req.input('phone', sql.NVarChar(50), lead.phone || null);
        req.input('company', sql.NVarChar(255), lead.company || null);
        req.input('status', sql.NVarChar(50), lead.status);
        req.input('score', sql.Int, lead.score);
        req.input('source', sql.NVarChar(50), lead.source);
        req.input('notes', sql.NVarChar(sql.MAX), lead.notes || null);

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
      } catch (err: any) {
        console.error('SQL Server persist lead error:', err.message);
      }
    }
  }

  async deleteLeadFromSql(id: string): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try { await this.pgPool.query('DELETE FROM leads WHERE id = $1', [id]); } catch {}
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('id', sql.NVarChar(50), id);
        await req.query('DELETE FROM leads WHERE id = @id');
      } catch {}
    }
  }

  async persistConversation(conv: Conversation): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO conversations (id, tenant_id, lead_id, channel, status, sentiment, summary)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO UPDATE SET status = $5, sentiment = $6, summary = $7`,
          [conv.id, conv.tenantId, conv.leadId || null, conv.channel, conv.status, conv.sentiment, conv.summary || null]
        );
      } catch {}
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('id', sql.NVarChar(50), conv.id);
        req.input('tenantId', sql.NVarChar(50), conv.tenantId);
        req.input('leadId', sql.NVarChar(50), conv.leadId || null);
        req.input('channel', sql.NVarChar(50), conv.channel);
        req.input('status', sql.NVarChar(50), conv.status);
        req.input('sentiment', sql.NVarChar(50), conv.sentiment);
        req.input('summary', sql.NVarChar(sql.MAX), conv.summary || null);

        await req.query(`
          IF EXISTS (SELECT 1 FROM conversations WHERE id = @id)
            UPDATE conversations SET status = @status, sentiment = @sentiment, summary = @summary, leadId = @leadId, updatedAt = SYSDATETIME() WHERE id = @id
          ELSE
            INSERT INTO conversations (id, tenantId, leadId, channel, status, sentiment, summary) VALUES (@id, @tenantId, @leadId, @channel, @status, @sentiment, @summary)
        `);
      } catch {}
    }
  }

  async persistChatMessage(msg: ChatMessage): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO chat_messages (id, conversation_id, sender_type, content, tokens_used)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          [msg.id, msg.conversationId, msg.senderType, msg.content, msg.tokensUsed || 0]
        );
      } catch {}
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('id', sql.NVarChar(50), msg.id);
        req.input('conversationId', sql.NVarChar(50), msg.conversationId);
        req.input('senderType', sql.NVarChar(50), msg.senderType);
        req.input('content', sql.NVarChar(sql.MAX), msg.content);
        req.input('tokensUsed', sql.Int, msg.tokensUsed || 0);
        await req.query(`INSERT INTO chat_messages (id, conversationId, senderType, content, tokensUsed) VALUES (@id, @conversationId, @senderType, @content, @tokensUsed)`);
      } catch {}
    }
  }

  async persistInvoice(inv: Invoice): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO invoices (id, tenant_id, lead_id, invoice_number, client_name, client_email, amount, tax, status, due_date, items_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET status = $9`,
          [inv.id, inv.tenantId, inv.leadId, inv.invoiceNumber, inv.clientName, inv.clientEmail, inv.amount, inv.tax, inv.status, new Date(inv.dueDate), JSON.stringify(inv.items)]
        );
      } catch {}
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('id', sql.NVarChar(50), inv.id);
        req.input('tenantId', sql.NVarChar(50), inv.tenantId);
        req.input('leadId', sql.NVarChar(50), inv.leadId);
        req.input('invoiceNumber', sql.NVarChar(100), inv.invoiceNumber);
        req.input('clientName', sql.NVarChar(255), inv.clientName);
        req.input('clientEmail', sql.NVarChar(255), inv.clientEmail);
        req.input('amount', sql.Float, inv.amount);
        req.input('tax', sql.Float, inv.tax);
        req.input('status', sql.NVarChar(50), inv.status);
        req.input('dueDate', sql.DateTime2, new Date(inv.dueDate));
        req.input('itemsJson', sql.NVarChar(sql.MAX), JSON.stringify(inv.items));

        await req.query(`
          IF EXISTS (SELECT 1 FROM invoices WHERE id = @id)
            UPDATE invoices SET status = @status, updatedAt = SYSDATETIME() WHERE id = @id
          ELSE
            INSERT INTO invoices (id, tenantId, leadId, invoiceNumber, clientName, clientEmail, amount, tax, status, dueDate, itemsJson)
            VALUES (@id, @tenantId, @leadId, @invoiceNumber, @clientName, @clientEmail, @amount, @tax, @status, @dueDate, @itemsJson)
        `);
      } catch {}
    }
  }

  async persistSettings(settings: BusinessSettings): Promise<void> {
    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO business_settings (id, tenant_id, bot_name, greeting_message, system_prompt, knowledge_base_text, auto_reply_email, qualification_goal, theme_color)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (tenant_id) DO UPDATE
           SET bot_name = $3, greeting_message = $4, system_prompt = $5, knowledge_base_text = $6, auto_reply_email = $7, qualification_goal = $8, theme_color = $9`,
          [settings.id, settings.tenantId, settings.botName, settings.greetingMessage, settings.systemPrompt, settings.knowledgeBaseText, settings.autoReplyEmail, settings.qualificationGoal, settings.themeColor]
        );
      } catch {}
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        const req = this.sqlPool.request();
        req.input('tenantId', sql.NVarChar(50), settings.tenantId);
        req.input('botName', sql.NVarChar(255), settings.botName);
        req.input('greetingMessage', sql.NVarChar(sql.MAX), settings.greetingMessage);
        req.input('systemPrompt', sql.NVarChar(sql.MAX), settings.systemPrompt);
        req.input('knowledgeBaseText', sql.NVarChar(sql.MAX), settings.knowledgeBaseText);
        req.input('autoReplyEmail', sql.Bit, settings.autoReplyEmail ? 1 : 0);
        req.input('qualificationGoal', sql.NVarChar(sql.MAX), settings.qualificationGoal);
        req.input('themeColor', sql.NVarChar(50), settings.themeColor);

        await req.query(`
          UPDATE business_settings
          SET botName = @botName, greetingMessage = @greetingMessage, systemPrompt = @systemPrompt,
              knowledgeBaseText = @knowledgeBaseText, autoReplyEmail = @autoReplyEmail,
              qualificationGoal = @qualificationGoal, themeColor = @themeColor
          WHERE tenantId = @tenantId
        `);
      } catch {}
    }
  }

  async getStatus(): Promise<any> {
    const start = Date.now();
    let pingMs = 0;

    if (this.dbEngine === 'POSTGRES' && this.pgPool) {
      try {
        await this.pgPool.query('SELECT 1');
        pingMs = Date.now() - start;
      } catch { this.isConnected = false; }
    } else if (this.dbEngine === 'SQL_SERVER' && this.sqlPool) {
      try {
        await this.sqlPool.request().query('SELECT 1');
        pingMs = Date.now() - start;
      } catch { this.isConnected = false; }
    }

    return {
      connected: this.isConnected,
      engine: this.dbEngine === 'POSTGRES' ? 'PostgreSQL (Cloud Free Tier)' : this.dbEngine === 'SQL_SERVER' ? 'Microsoft SQL Server' : 'In-Memory Dev Store',
      database: this.activeDbName,
      server: this.dbEngine === 'POSTGRES' ? 'Cloud Serverless' : `${ENV.DB_SERVER}:${ENV.DB_PORT}`,
      version: this.dbVersion || 'Active',
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

export const db = new DatabaseStore();

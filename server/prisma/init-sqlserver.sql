USE AIBusinessSaaS;

-- 1. Tenants Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tenants')
BEGIN
    CREATE TABLE tenants (
        id NVARCHAR(50) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        companyEmail NVARCHAR(255) NOT NULL,
        industry NVARCHAR(100) DEFAULT 'General',
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END;

-- 2. Users Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id NVARCHAR(50) PRIMARY KEY,
        tenantId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE,
        email NVARCHAR(255) NOT NULL UNIQUE,
        passwordHash NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'ADMIN',
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END;

-- 3. Leads Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'leads')
BEGIN
    CREATE TABLE leads (
        id NVARCHAR(50) PRIMARY KEY,
        tenantId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50),
        company NVARCHAR(255),
        status NVARCHAR(50) DEFAULT 'NEW',
        score INT DEFAULT 50,
        source NVARCHAR(50) DEFAULT 'CHATBOT',
        notes NVARCHAR(MAX),
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_leads_tenantId ON leads(tenantId);
    CREATE INDEX IX_leads_email ON leads(email);
END;

-- 4. Conversations Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'conversations')
BEGIN
    CREATE TABLE conversations (
        id NVARCHAR(50) PRIMARY KEY,
        tenantId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE,
        leadId NVARCHAR(50) FOREIGN KEY REFERENCES leads(id) ON DELETE NO ACTION,
        channel NVARCHAR(50) DEFAULT 'WEB_CHAT',
        status NVARCHAR(50) DEFAULT 'OPEN',
        sentiment NVARCHAR(50) DEFAULT 'NEUTRAL',
        summary NVARCHAR(MAX),
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_conversations_tenantId ON conversations(tenantId);
    CREATE INDEX IX_conversations_leadId ON conversations(leadId);
END;

-- 5. Chat Messages Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'chat_messages')
BEGIN
    CREATE TABLE chat_messages (
        id NVARCHAR(50) PRIMARY KEY,
        conversationId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES conversations(id) ON DELETE CASCADE,
        senderType NVARCHAR(50) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        tokensUsed INT DEFAULT 0,
        createdAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_chat_messages_conversationId ON chat_messages(conversationId);
END;

-- 6. Invoices Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'invoices')
BEGIN
    CREATE TABLE invoices (
        id NVARCHAR(50) PRIMARY KEY,
        tenantId NVARCHAR(50) NOT NULL FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE,
        leadId NVARCHAR(50),
        invoiceNumber NVARCHAR(100) NOT NULL UNIQUE,
        clientName NVARCHAR(255) NOT NULL,
        clientEmail NVARCHAR(255) NOT NULL,
        amount FLOAT NOT NULL,
        tax FLOAT DEFAULT 0.0,
        status NVARCHAR(50) DEFAULT 'DRAFT',
        issueDate DATETIME2 DEFAULT SYSDATETIME(),
        dueDate DATETIME2 NOT NULL,
        itemsJson NVARCHAR(MAX) NOT NULL,
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
    CREATE INDEX IX_invoices_tenantId ON invoices(tenantId);
END;

-- 7. Business Settings Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'business_settings')
BEGIN
    CREATE TABLE business_settings (
        id NVARCHAR(50) PRIMARY KEY,
        tenantId NVARCHAR(50) NOT NULL UNIQUE FOREIGN KEY REFERENCES tenants(id) ON DELETE CASCADE,
        botName NVARCHAR(255) DEFAULT 'Aura AI',
        greetingMessage NVARCHAR(MAX) NOT NULL,
        systemPrompt NVARCHAR(MAX) NOT NULL,
        knowledgeBaseText NVARCHAR(MAX) NOT NULL,
        autoReplyEmail BIT DEFAULT 1,
        qualificationGoal NVARCHAR(MAX) NOT NULL,
        themeColor NVARCHAR(50) DEFAULT '#4f46e5',
        createdAt DATETIME2 DEFAULT SYSDATETIME(),
        updatedAt DATETIME2 DEFAULT SYSDATETIME()
    );
END;

-- Seed Default Tenant
IF NOT EXISTS (SELECT * FROM tenants WHERE id = 'tenant_default_demo')
BEGIN
    INSERT INTO tenants (id, name, companyEmail, industry)
    VALUES ('tenant_default_demo', 'Apex Digital Solutions', 'contact@apexdigital.example.com', 'B2B Web & SaaS Consulting');
END;

-- Seed Default Settings
IF NOT EXISTS (SELECT * FROM business_settings WHERE tenantId = 'tenant_default_demo')
BEGIN
    INSERT INTO business_settings (id, tenantId, botName, greetingMessage, systemPrompt, knowledgeBaseText, autoReplyEmail, qualificationGoal, themeColor)
    VALUES (
        'settings_demo',
        'tenant_default_demo',
        'Apex Assistant',
        'Hello! I am your AI assistant. How can we help automate your business or build your next project?',
        'You are the knowledgeable sales and support AI for Apex Digital Solutions. Answer visitor questions professionally, explain services (Web Dev, AI SaaS, Cloud Migration), and proactively ask for their email address and project requirements so our human consultants can follow up.',
        'Services: Web Development ($3,000+), AI Workflow Automation ($2,000+), Cloud Maintenance ($500/mo). Turnaround is typically 2-4 weeks. We work with clients globally.',
        1,
        'Collect visitor name, email address, company name, estimated budget, and key goals.',
        '#4f46e5'
    );
END;

-- Seed Initial Leads
IF NOT EXISTS (SELECT * FROM leads WHERE id = 'lead_1')
BEGIN
    INSERT INTO leads (id, tenantId, name, email, phone, company, status, score, source, notes)
    VALUES 
    ('lead_1', 'tenant_default_demo', 'Sarah Jenkins', 'sarah.j@vertexlogistics.com', '+1 (555) 234-5678', 'Vertex Logistics', 'QUALIFIED', 88, 'CHATBOT', 'Interested in AI customer query triage. Budget ~$4,500.'),
    ('lead_2', 'tenant_default_demo', 'Michael Chen', 'm.chen@novapharma.org', '+1 (555) 876-5432', 'Nova Pharma', 'NEW', 65, 'EMAIL', 'Sent inquiry asking about automated invoice dispatch integration.'),
    ('lead_3', 'tenant_default_demo', 'Elena Rostova', 'elena@craftdesign.co', NULL, 'Craft Design Studio', 'PROPOSAL', 95, 'CHATBOT', 'Proposal sent for website + customer portal bot.');
END;

-- Seed Initial Invoices
IF NOT EXISTS (SELECT * FROM invoices WHERE id = 'inv_1')
BEGIN
    INSERT INTO invoices (id, tenantId, leadId, invoiceNumber, clientName, clientEmail, amount, tax, status, dueDate, itemsJson)
    VALUES
    ('inv_1', 'tenant_default_demo', 'lead_3', 'INV-2026-001', 'Elena Rostova', 'elena@craftdesign.co', 3200, 256, 'SENT', DATEADD(day, 10, SYSDATETIME()), '[{"description":"AI Customer Bot Setup & Prompt Engineering","quantity":1,"unitPrice":2000,"total":2000},{"description":"Custom React Embed Widget & Integration","quantity":1,"unitPrice":1200,"total":1200}]'),
    ('inv_2', 'tenant_default_demo', 'lead_1', 'INV-2026-002', 'Sarah Jenkins', 'sarah.j@vertexlogistics.com', 4500, 360, 'PAID', DATEADD(day, -1, SYSDATETIME()), '[{"description":"Workflow Automation Audit & Architecture","quantity":1,"unitPrice":4500,"total":4500}]');
END;

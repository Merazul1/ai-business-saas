-- ==============================================================================
-- POSTGRESQL SCHEMA FOR FREE CLOUD DATABASES (SUPABASE, NEON, RENDER POSTGRES)
-- ==============================================================================

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    industry VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Business Settings Table
CREATE TABLE IF NOT EXISTS business_settings (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    bot_name VARCHAR(255) DEFAULT 'Aura AI',
    greeting_message TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    knowledge_base_text TEXT NOT NULL,
    auto_reply_email BOOLEAN DEFAULT TRUE,
    qualification_goal TEXT NOT NULL,
    theme_color VARCHAR(50) DEFAULT '#4f46e5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Leads Table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_leads_tenant_id ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS ix_leads_email ON leads(email);

-- 4. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE SET NULL,
    channel VARCHAR(50) DEFAULT 'WEB_CHAT',
    status VARCHAR(50) DEFAULT 'OPEN',
    sentiment VARCHAR(50) DEFAULT 'NEUTRAL',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_conversations_tenant_id ON conversations(tenant_id);

-- 5. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(50) PRIMARY KEY,
    conversation_id VARCHAR(50) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_chat_messages_conv_id ON chat_messages(conversation_id);

-- 6. Invoices Table
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
    items_json TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS ix_invoices_tenant_id ON invoices(tenant_id);

-- Seed Default Tenant
INSERT INTO tenants (id, name, company_email, industry)
VALUES ('tenant_default_demo', 'Apex Digital Solutions', 'contact@apexdigital.example.com', 'B2B Web & SaaS Consulting')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Settings
INSERT INTO business_settings (id, tenant_id, bot_name, greeting_message, system_prompt, knowledge_base_text, auto_reply_email, qualification_goal, theme_color)
VALUES (
    'settings_demo',
    'tenant_default_demo',
    'Apex Assistant',
    'Hello! I am your AI assistant. How can we help automate your business or build your next project?',
    'You are the knowledgeable sales and support AI for Apex Digital Solutions. Answer visitor questions professionally, explain services (Web Dev, AI SaaS, Cloud Migration), and proactively ask for their email address and project requirements so our human consultants can follow up.',
    'Services: Web Development ($3,000+), AI Workflow Automation ($2,000+), Cloud Maintenance ($500/mo). Turnaround is typically 2-4 weeks. We work with clients globally.',
    TRUE,
    'Collect visitor name, email address, company name, estimated budget, and key goals.',
    '#4f46e5'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Leads
INSERT INTO leads (id, tenant_id, name, email, phone, company, status, score, source, notes)
VALUES 
('lead_1', 'tenant_default_demo', 'Sarah Jenkins', 'sarah.j@vertexlogistics.com', '+1 (555) 234-5678', 'Vertex Logistics', 'QUALIFIED', 88, 'CHATBOT', 'Interested in AI customer query triage. Budget ~$4,500.'),
('lead_2', 'tenant_default_demo', 'Michael Chen', 'm.chen@novapharma.org', '+1 (555) 876-5432', 'Nova Pharma', 'NEW', 65, 'EMAIL', 'Sent inquiry asking about automated invoice dispatch integration.'),
('lead_3', 'tenant_default_demo', 'Elena Rostova', 'elena@craftdesign.co', NULL, 'Craft Design Studio', 'PROPOSAL', 95, 'CHATBOT', 'Proposal sent for website + customer portal bot.')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Invoices
INSERT INTO invoices (id, tenant_id, lead_id, invoice_number, client_name, client_email, amount, tax, status, due_date, items_json)
VALUES
('inv_1', 'tenant_default_demo', 'lead_3', 'INV-2026-001', 'Elena Rostova', 'elena@craftdesign.co', 3200, 256, 'SENT', NOW() + INTERVAL '10 days', '[{"description":"AI Customer Bot Setup & Prompt Engineering","quantity":1,"unitPrice":2000,"total":2000},{"description":"Custom React Embed Widget & Integration","quantity":1,"unitPrice":1200,"total":1200}]'),
('inv_2', 'tenant_default_demo', 'lead_1', 'INV-2026-002', 'Sarah Jenkins', 'sarah.j@vertexlogistics.com', 4500, 360, 'PAID', NOW() - INTERVAL '1 day', '[{"description":"Workflow Automation Audit & Architecture","quantity":1,"unitPrice":4500,"total":4500}]')
ON CONFLICT (id) DO NOTHING;

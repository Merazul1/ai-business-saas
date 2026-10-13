# AI Business Automation SaaS 🚀

A full-stack multi-tenant platform designed to help small and medium businesses (SMBs) automate visitor support, lead capture, email triage, and client invoicing.

---

## 🌟 Key Features

1. **AI Chatbot for Website Visitors**
   - Embeddable widget tag with zero dependencies (`<script src=".../widget.js">`).
   - Contextual business knowledge base injection and sales objection handling.
   - Proactive lead capture: automatically extracts visitor email, name, phone, and requirements.

2. **Customer & Lead Management (CRM)**
   - Automatic lead scoring (0–100) based on intent and responsiveness.
   - Pipeline stage management (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `CLOSED`).
   - Interaction history tracking across both web chat and email.

3. **Inbound Email & Message Auto-Responder**
   - AI classification: categorizes inquiries into `SALES_LEAD`, `SUPPORT_TICKET`, `BILLING`, or `GENERAL`.
   - Urgency rating and smart response drafting.
   - Auto-enrollment into the CRM.

4. **Invoice & Report Generation**
   - Line items calculation, tax automation, and status tracking.
   - **1-Click PDF Export** generated dynamically on the server with PDFKit.

5. **AI Bot Studio & Admin Dashboard**
   - Real-time KPI metrics: revenue collected, conversion rate, bot automation rate.
   - No-code prompt engineering interface to adjust bot tone, business facts, and theme colors.
   - Interactive live test chat simulator.

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | Microsoft SQL Server (Prisma ORM schema provided) with hybrid local fallback |
| **Caching / Sessions** | Redis client (`ioredis`) with memory fallback |
| **AI Integration** | OpenAI API (`gpt-4o-mini`) + Intelligent heuristic fallback engine |
| **PDF Engine** | PDFKit |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Open a terminal in the root directory:
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 2. Configure Environment (Optional)
The server works out-of-the-box with built-in fallbacks. To connect real services, edit `server/.env`:

- **OpenAI API Key**: Set `OPENAI_API_KEY=sk-...` to use live GPT-4o models.
- **SQL Server**: Set `DATABASE_URL=sqlserver://localhost:1433;database=AIBusinessSaaS;user=sa;password=...`
- **Redis**: Set `REDIS_URL=redis://localhost:6379`

### 3. Run the Development Servers
In two separate terminals:

**Terminal 1 (Backend API):**
```bash
cd server
npm run dev
# Server will run at http://localhost:5000
```

**Terminal 2 (Frontend Admin Dashboard):**
```bash
cd client
npm run dev
# Dashboard will run at http://localhost:3000
```

### 4. Test the Embedded Widget Demo
Open your browser to:
```
http://localhost:5000/widget/demo.html
```
Click the chat bubble on the bottom right and test asking:
> *"What services do you offer and what is your pricing?"*
> *"My name is Jordan, email is jordan@example.com, looking for a quote."*

Then check your Admin Dashboard at `http://localhost:3000` to see Jordan automatically added into your CRM!

---

## 💼 Career & Freelancing Value

- **High-Value Client Offering**: Small businesses pay \$1,500–\$5,000 upfront setup fees plus \$150–\$500/month recurring retainer for AI customer support and lead management.
- **Portfolio Showcase**: Demonstrates production-grade multi-tenancy, enterprise database modeling (SQL Server / Prisma), OpenAI structured outputs, Redis caching, and real-time frontend architecture.

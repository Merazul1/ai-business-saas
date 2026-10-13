"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const apiRoutes_1 = require("./routes/apiRoutes");
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
// Serve embed widget static files
app.use('/widget', express_1.default.static(path_1.default.join(__dirname, '../../widget')));
// API Routes
app.use('/api', apiRoutes_1.apiRouter);
// Health check endpoint
app.get('/health', async (req, res) => {
    const dbStatus = await db_1.db.getStatus();
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'AI Business Automation SaaS API',
        version: '1.0.0',
        database: dbStatus
    });
});
app.listen(env_1.ENV.PORT, async () => {
    console.log(`🚀 AI Business Automation SaaS Server is running on port ${env_1.ENV.PORT}`);
    console.log(`🔗 Health check: http://localhost:${env_1.ENV.PORT}/health`);
    console.log(`🔗 API Base: http://localhost:${env_1.ENV.PORT}/api`);
    // Initialize SQL Server connection
    await db_1.db.init();
});

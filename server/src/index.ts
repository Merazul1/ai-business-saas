import express from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import { apiRouter } from './routes/apiRoutes';

import path from 'path';
import { db } from './config/db';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve embed widget static files
app.use('/widget', express.static(path.join(__dirname, '../../widget')));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await db.getStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AI Business Automation SaaS API',
    version: '1.0.0',
    database: dbStatus
  });
});

// Serve compiled React Dashboard client (SPA)
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/widget') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(ENV.PORT, async () => {
  console.log(`🚀 AI Business Automation SaaS Server is running on port ${ENV.PORT}`);
  console.log(`🔗 Health check: http://localhost:${ENV.PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
  
  // Initialize SQL Server connection
  await db.init();
});

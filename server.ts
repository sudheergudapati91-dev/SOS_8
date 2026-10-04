import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  getFullErpData,
  saveFirm,
  deleteFirm,
  saveProject,
  deleteProject,
  savePlot,
  saveApartmentUnit,
  saveFirmAccount,
  addAccountTransaction,
  saveProjectExpense,
  savePartner,
  saveIndividualInvestment,
  saveFieldExpense,
  addAuditLogEntry,
  resetAllErpData,
  ensureDbSeeded,
  validateFirmCode,
  authenticateAppUser,
  changeUserPin,
  getAppUsersList
} from './src/db/erp.ts';
import { getUsers, getOrCreateUser } from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS middleware for React Native mobile apps & external web clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Ensure Cloud SQL is primed
  await ensureDbSeeded();

  // Health and Status API
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      database: 'Cloud SQL PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  });

  // Source Bundle Download for Cloud Shell Deployment
  app.get('/api/bundle.tar.gz', (_req, res) => {
    const bundlePath = path.resolve(__dirname, 'public', 'bundle.tar.gz');
    if (fs.existsSync(bundlePath)) {
      res.download(bundlePath, 'bundle.tar.gz');
    } else {
      res.status(404).send('Bundle not found');
    }
  });

  // --- Production Authentication APIs ---
  app.get('/api/auth/validate-firm/:code', async (req, res) => {
    try {
      const firm = await validateFirmCode(req.params.code);
      if (firm) {
        res.json({
          valid: true,
          firm: {
            id: firm.id,
            name: firm.name,
            code: firm.code,
            location: firm.location,
            state: firm.state,
          },
        });
      } else {
        res.status(404).json({ valid: false, error: `Firm Code "${req.params.code}" not found.` });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const result = await authenticateAppUser(req.body);
      if (result.success) {
        res.json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/auth/change-pin', async (req, res) => {
    try {
      const { phone, newPin } = req.body;
      const result = await changeUserPin(phone, newPin);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get('/api/auth/users', async (_req, res) => {
    try {
      const users = await getAppUsersList();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- ERP Cloud SQL APIs ---
  app.get('/api/erp/all', async (_req, res) => {
    try {
      const data = await getFullErpData();
      res.json(data);
    } catch (error: any) {
      console.error('API /api/erp/all failed:', error);
      res.status(500).json({ error: error.message || 'Database error' });
    }
  });

  app.post('/api/erp/firms', async (req, res) => {
    try {
      const saved = await saveFirm(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/erp/firms/:id', async (req, res) => {
    try {
      const result = await deleteFirm(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/projects', async (req, res) => {
    try {
      const saved = await saveProject(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/erp/projects/:id', async (req, res) => {
    try {
      const result = await deleteProject(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/plots', async (req, res) => {
    try {
      const saved = await savePlot(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/apartment-units', async (req, res) => {
    try {
      const saved = await saveApartmentUnit(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/firm-accounts', async (req, res) => {
    try {
      const saved = await saveFirmAccount(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/account-transactions', async (req, res) => {
    try {
      const saved = await addAccountTransaction(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/project-expenses', async (req, res) => {
    try {
      const saved = await saveProjectExpense(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/partners', async (req, res) => {
    try {
      const saved = await savePartner(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/individual-investments', async (req, res) => {
    try {
      const saved = await saveIndividualInvestment(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/field-expenses', async (req, res) => {
    try {
      const saved = await saveFieldExpense(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/audit-logs', async (req, res) => {
    try {
      const saved = await addAuditLogEntry(req.body);
      res.json(saved);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/erp/reset', async (req, res) => {
    try {
      const cleanSlate = req.body?.cleanSlate === true;
      const result = await resetAllErpData(cleanSlate);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/users', async (_req, res) => {
    try {
      const allUsers = await getUsers();
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Client SPA serving configuration
  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const hasDist = fs.existsSync(distIndex);

  if (hasDist && process.env.NODE_ENV === 'production') {
    // Production mode with pre-built dist
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(distIndex, (err) => {
        if (err) {
          next(err);
        }
      });
    });
  } else {
    // Development mode with Vite middleware (or fallback if dist is missing)
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      const url = req.originalUrl;
      try {
        const rootIndex = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(rootIndex, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  // Dynamic port for Cloud Run (process.env.PORT) or local fallback (3000)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`SyndicateOS Server running at http://0.0.0.0:${port} (Port: ${port})`);
  });
}

startServer();

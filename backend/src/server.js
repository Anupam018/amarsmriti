import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import { login, requireAuth } from './auth.js';
import routes from './routes.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.post('/api/login', login);
app.use('/api', requireAuth, routes);

// Serve the built React app too (single-service deploy)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'সার্ভারে সমস্যা হয়েছে' });
});

const port = process.env.PORT || 4000;
initDb()
  .then(() => app.listen(port, () => console.log(`API on :${port}`)))
  .catch((e) => { console.error('DB init failed', e); process.exit(1); });

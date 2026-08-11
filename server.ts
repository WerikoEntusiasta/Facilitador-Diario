import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import apiRoutes from './server/routes';

async function startServer() {
  console.log('Initializing SQLite Database...');
  await initDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for mobile devices & external clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Server-Key, X-Vault-Password');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    // Optional server secret key check if configured
    const requiredKey = process.env.SERVER_ACCESS_KEY;
    if (requiredKey && requiredKey.trim().length > 0) {
      const providedKey = req.headers['x-server-key'];
      if (providedKey !== requiredKey && !req.path.startsWith('/api/health')) {
        return res.status(403).json({ error: 'Acesso negado: Chave/Senha do Servidor inválida' });
      }
    }
    
    next();
  });

  // Serve API routes
  app.use('/api', apiRoutes);

  // Serve static uploads with strict security headers
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      next();
    },
    express.static(path.join(process.cwd(), 'uploads'))
  );

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KeepBoard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

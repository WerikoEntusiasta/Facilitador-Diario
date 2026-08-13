import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/db';
import apiRoutes from './server/routes';

async function startServer() {
  console.log('Initializing SQLite Database...');
  await initDatabase();

  const app = express();
  const PORT = 3000;

  // Disable X-Powered-By header to prevent information leakage
  app.disable('x-powered-by');

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Flexible CORS handling for development, preview environments, and mobile app clients
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Server-Key, X-Vault-Password');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Security Headers via Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'", "https:"],
          frameAncestors: ["'none'"],
        },
      } : false, // Disable strict CSP in development for Vite HMR & client
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: isProd ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      } : false,
      frameguard: isProd ? { action: 'deny' } : false, // Allow framing in development for AI Studio preview
      noSniff: true,
    })
  );

  // Serve API routes
  app.use('/api', apiRoutes);

  // Serve static uploads with strict security headers
  app.use(
    '/uploads',
    (req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      res.setHeader('Cache-Control', 'private, max-age=3600');
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
    // Serve static assets with correct Cache-Control policies
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.includes('/assets/')) {
            // Immutable hashed assets cache for 1 year
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          } else if (
            filePath.endsWith('index.html') ||
            filePath.endsWith('manifest.json') ||
            filePath.endsWith('robots.txt') ||
            filePath.endsWith('sitemap.xml')
          ) {
            // No cache for HTML and metadata files so updates reflect immediately
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=0');
          }
        },
      })
    );
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

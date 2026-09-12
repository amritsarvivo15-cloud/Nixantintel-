import path from 'path';
import { createServer as createViteServer } from 'vite';
import express from 'express';
import { createRadarApp } from './server/radarApi';

const PORT = Number(process.env.PORT) || 3000;
const app = createRadarApp();

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GMV Portfolio Server running on port ${PORT}`);
  });
}

startServer();

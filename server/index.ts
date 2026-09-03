import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
const { app } = createApp();

if (process.env.NODE_ENV === 'production') {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientDirectory = path.resolve(currentDirectory, '../../client');
  app.use(express.static(clientDirectory));
  app.get('*path', (_request, response) => response.sendFile(path.join(clientDirectory, 'index.html')));
}

app.listen(port, () => {
  console.log(`ROLLFORWARD API listening on http://localhost:${port}`);
});


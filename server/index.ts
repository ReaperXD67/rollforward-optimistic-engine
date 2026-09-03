import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const port = positiveInteger(process.env.PORT, 8787);
const host = process.env.HOST ?? '0.0.0.0';
const { app } = createApp({
  maxEntries: positiveInteger(process.env.SCENARIO_MAX_ENTRIES, 256),
  ttlMs: positiveInteger(process.env.SCENARIO_TTL_MS, 30 * 60 * 1_000),
});

if (process.env.NODE_ENV === 'production') {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientDirectory = path.resolve(currentDirectory, '../../client');
  app.use(express.static(clientDirectory));
  app.get('*path', (_request, response) => response.sendFile(path.join(clientDirectory, 'index.html')));
}

const httpServer = app.listen(port, host, () => {
  console.log(`ROLLFORWARD listening on http://${host}:${port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  console.log(`${signal} received; draining active requests.`);
  httpServer.close((error) => {
    if (error) {
      console.error('Graceful shutdown failed.', error);
      process.exitCode = 1;
    }
  });

  const forceExitTimer = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 18_000);
  forceExitTimer.unref();
}

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

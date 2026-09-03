process.env.NODE_ENV = 'production';
process.env.PORT = '8791';

await import('../dist/server/server/index.js');

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createRadarApp } = require('./radar.cjs');
const app = createRadarApp();

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export default function handler(req, res) {
  return app(req, res);
}

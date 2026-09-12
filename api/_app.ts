import type { IncomingMessage, ServerResponse } from 'http';
import { createRadarApp } from '../server/radarApi';

const app = createRadarApp();

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}

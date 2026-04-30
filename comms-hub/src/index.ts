import { handleHttp } from './http';
import type { Env } from './types';

export default {
  async fetch(req: Request, env: Env) {
    return handleHttp(req, env, new URL(req.url));
  }
};

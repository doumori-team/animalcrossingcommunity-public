// any file that doesn't have typing

declare module 'markdown-it-ins';
declare module 'judoscale-express';
declare module 'react-photo-album';
declare module 'eslint-plugin-import';
declare module 'supertest';
declare module 'ws';
declare module 'web-push';

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: number | null;
    username: string | null;
  }
}
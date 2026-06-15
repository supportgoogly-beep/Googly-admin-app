import serverless from 'serverless-http';
import { app } from '../../dist/server.cjs';

export const handler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

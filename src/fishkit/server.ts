import compression from 'compression';
import history from 'connect-history-api-fallback';
import cors from 'cors';
import express from 'express';
import { getPort } from 'get-port-please';
import http from 'http';
import type { Config } from '../config/types';
import { DEFAULT_PORT } from '../constants';
import { createHttpsServer } from './https';

export interface ServerOpts {
  devServer: Config['devServer'];
}

export async function createServer(opts: ServerOpts): Promise<{
  server: http.Server;
  app: express.Application;
  port: number;
  ip?: string;
  host: string;
}> {
  const {
    port = DEFAULT_PORT,
    host = 'localhost',
    https,
    ip,
  } = opts.devServer || {};
  const _port = await getPort(port);
  const app = express();

  // cors
  app.use(
    cors({
      origin: true,
      methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  // compression
  app.use(compression());

  // history fallback
  app.use(
    history({
      index: '/',
    }),
  );

  // create server
  let server;
  if (https) {
    https.hosts ||= uniq(
      [
        ...(https.hosts || []),
        // always add localhost, 127.0.0.1, ip and host
        '127.0.0.1',
        'localhost',
        ip,
        host !== '0.0.0.0' && host,
      ].filter(Boolean) as string[],
    );
    server = await createHttpsServer(app, https);
  } else {
    server = http.createServer(app);
  }

  server.listen(_port, () => {
    const protocol = https ? 'https:' : 'http:';
    console.log(`Server is running on ${protocol}//${host}:${_port}`);
  });

  return { server, app, port: _port, ip, host };
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}

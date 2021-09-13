import http from 'http';
import debug from 'debug';
import CommonRoutesConfig from './common/routes/common.routes.config';
import app, { routes } from './app';

const log: debug.IDebugger = debug('app');

const server: http.Server = http.createServer(app);
const port = 3000;

server.listen(port, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    log(`Routes configured for ${route.getName()}`);
  });
  // the only time we want to use console-log
  console.log(`Server running at http://localhost:${port}`);
});

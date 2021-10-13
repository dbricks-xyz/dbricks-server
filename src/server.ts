import http from 'http';
import CommonRoutesConfig from './common/routes/common.routes.config';
import app, {routes} from './app';

const server: http.Server = http.createServer(app);
const port = 3000;

server.listen(port, () => {
  routes.forEach((route: CommonRoutesConfig) => {
    console.log(`Routes configured for ${route.getName()}`);
  });
  console.log(`Server running at http://localhost:${port}`);
});

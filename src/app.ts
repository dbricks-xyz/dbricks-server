import e from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import CommonRoutesConfig from './common/routes/common.routes.config';
import { SerumRoutes } from './serum/routes/serum.routes';
import { MangoRoutes } from './mango/routes/mango.routes';
/* eslint-enable */

const app: e.Application = e();

app.use(e.json());
app.use(cors());

// automatic logging of all HTTP requests handled by express.js
const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({ all: true }),
  ),
};
if (!process.env.DEBUG) {
  loggerOptions.meta = false;
}
app.use(expressWinston.logger(loggerOptions));

// routes
export const routes: Array<CommonRoutesConfig> = [];
routes.push(new SerumRoutes(app));
routes.push(new MangoRoutes(app));

// test route
app.get('/ping', (req: e.Request, res: e.Response) => {
  res.status(200).send('pong');
});

export default app;

import e from 'express';
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import CommonRoutesConfig from './common/routes/common.routes.config';
import {SerumRoutes} from './serum/routes/serum.routes';
import {MangoRoutes} from './mango/routes/mango.routes';
import {CommonRoutes} from "./common/routes/common.routes";
import rateLimit from 'express-rate-limit';
/* eslint-enable */

const app: e.Application = e();

app.use(e.json());
app.use(cors());
app.use(rateLimit({
  windowMs: 1000, // 1 second
  max: 30, // 30 requests
  message: "You exceeded 30 requests in 1 second limit!",
  headers: true,
}))

// automatic logging of all HTTP requests handled by express.js
const loggerOptions: expressWinston.LoggerOptions = {
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.json(),
    winston.format.prettyPrint(),
    winston.format.colorize({all: true}),
  ),
};
if (!process.env.DEBUG) {
  loggerOptions.meta = false;
}
app.use(expressWinston.logger(loggerOptions));

// routes
export const routes: Array<CommonRoutesConfig> = [];
routes.push(new CommonRoutes(app));
routes.push(new SerumRoutes(app));
routes.push(new MangoRoutes(app));

// test route
app.get('/ping', (req: e.Request, res: e.Response) => {
  res.status(200).send('pong');
});

export default app;

require('dotenv').config()

import e from 'express';
import debug from 'debug';
import * as http from 'http';

import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import cors from 'cors';
import {CommonRoutesConfig} from './common/routes/common.routes.config';
import {UsersRoutes} from './users/users.routes.config';
import {SerumRoutes} from "./serum/routes/serum.routes";

const app: e.Application = e();
const server: http.Server = http.createServer(app);
const port = 3000;
const routes: Array<CommonRoutesConfig> = [];
//replacement for console.log that will be enabled by DEBUG env variable
const debugLog: debug.IDebugger = debug('app');

app.use(e.json());
app.use(cors());
//automatic logging of all HTTP requests handled by express.js
const loggerOptions: expressWinston.LoggerOptions = {
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
        winston.format.json(),
        winston.format.prettyPrint(),
        winston.format.colorize({ all: true })
    ),
};
if (!process.env.DEBUG) {
    loggerOptions.meta = false;
}
app.use(expressWinston.logger(loggerOptions));

routes.push(new UsersRoutes(app));
routes.push(new SerumRoutes(app));

//test route
const runningMessage = `Server running at http://localhost:${port}`;
app.get('/', (req: e.Request, res: e.Response) => {
    res.status(200).send(runningMessage)
});

server.listen(port, () => {
    routes.forEach((route: CommonRoutesConfig) => {
        debugLog(`Routes configured for ${route.getName()}`);
    });
    //the only time we want to use console.log
    console.log(runningMessage);
})
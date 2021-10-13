import CommonRoutesConfig from "./common.routes.config";
import e from 'express';
import CommonController from '../controller/common.controller';

export class CommonRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'CommmonRoutes');
  }

  configureRoutes(): e.Application {
    this.app.route('/mintname')
      .post(
        CommonController.getMintName,
      );

    return this.app;
  }
}
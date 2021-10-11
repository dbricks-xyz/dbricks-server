import e from 'express';
import CommonRoutesConfig from '../../common/routes/common.routes.config';
import SaberMiddleware from '../middleware/saber.middleware';
import SaberController from '../controller/saber.controller';

export class SaberRoutes extends CommonRoutesConfig {
  constructor(app: e.Application) {
    super(app, 'SaberRoutes');
  }

  configureRoutes(): e.Application {
    this.app.route('/saber/swap')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.poolSwap,
      );

    this.app.route('/saber/pool/deposit')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.poolDeposit,
      );

    this.app.route('/saber/pool/withdraw')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.poolWithdraw,
      );

    this.app.route('/saber/farm/deposit')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.farmDeposit,
      );

    this.app.route('/saber/farm/withdraw')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.farmWithdraw,
      );

    this.app.route('/saber/farm/harvest')
      .post(
        SaberMiddleware.validateStuff,
        SaberController.farmHarvest,
      );

    return this.app;
  }
}

import e from 'express';
import debug from 'debug';
import {serializeInstructionsAndSigners,} from 'dbricks-lib';
import {
  deserializeCancel,
  deserializeDeposit,
  deserializePlace,
  deserializeSettle,
  deserializeWithdraw
} from './mango.controller.serializers';
import MangoDepositService from '../services/mango.service.deposit';
import MangoWithdrawService from '../services/mango.service.withdraw';
import MangoMarketService from '../services/mango.service.market';
import MangoOrderService from '../services/mango.service.order';

const log: debug.IDebugger = debug('app:mango-controller');

class MangoController {
  async deposit(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeDeposit(request);
    const mangoDepositService = new MangoDepositService();
    Promise.resolve(mangoDepositService.deposit(params))
      .then((instructionsAndSigners) => {
        log('Deposit instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async withdraw(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeWithdraw(request);
    const mangoWithdrawService = new MangoWithdrawService();
    Promise.resolve(mangoWithdrawService.withdraw(params))
      .then((instructionsAndSigners) => {
        log('Withdraw instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async settleSpot(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeSettle(request);
    const mangoMarketService = new MangoMarketService();
    Promise.resolve(mangoMarketService.settleSpot(params))
      .then((instructionsAndSigners) => {
        log('Settle spot orders instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async placeSpotOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializePlace(request);
    const mangoOrderService = new MangoOrderService();
    Promise.resolve(mangoOrderService.placeSpot(params))
      .then((instructionsAndSigners) => {
        log('Place spot order instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async cancelSpotOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeCancel(request);
    const mangoOrderService = new MangoOrderService();
    Promise.resolve(mangoOrderService.cancelSpot(params))
      .then((instructionsAndSigners) => {
        log('Cancel spot order instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async placePerpOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializePlace(request);
    const mangoOrderService = new MangoOrderService();
    Promise.resolve(mangoOrderService.placePerp(params))
      .then((instructionsAndSigners) => {
        log('Place perp order instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async cancelPerpOrder(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeCancel(request);
    const mangoOrderService = new MangoOrderService();
    Promise.resolve(mangoOrderService.cancelPerp(params))
      .then((instructionsAndSigners) => {
        log('Cancel perp order instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async settlePerp(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeSettle(request);
    const mangoMarketService = new MangoMarketService();
    Promise.resolve(mangoMarketService.settlePerp(params))
      .then((instructionsAndSigners) => {
        log('Settle perp PnL instruction generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }
}

export default new MangoController();

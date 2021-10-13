import e from 'express';
import debug from 'debug';
import {serializeInstructionsAndSigners} from '@dbricks/dbricks-ts';
import SaberPoolService from '../services/saber.service.pool';
import SaberFarmService from '../services/saber.service.farm';
import { deserializePoolDeposit, deserializeFarmDeposit, deserializeSwap, deserializePoolWithdraw, deserializeFarmWithdraw, deserializeFarmHarvest } from './saber.controller.serializer';

const log: debug.IDebugger = debug('app:saber-controller');

class SaberController {
  async poolDeposit(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializePoolDeposit(request);
    const saberPoolService = new SaberPoolService();
    Promise.resolve(saberPoolService.deposit(params))
      .then((instructionsAndSigners) => {
        log('Pool deposit instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async poolWithdraw(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializePoolWithdraw(request);
    const saberPoolService = new SaberPoolService();
    Promise.resolve(saberPoolService.withdraw(params))
      .then((instructionsAndSigners) => {
        log('Pool withdraw instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async poolSwap(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeSwap(request);
    const saberPoolService = new SaberPoolService();
    Promise.resolve(saberPoolService.swap(params))
      .then((instructionsAndSigners) => {
        log('Pool deposit instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async farmDeposit(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeFarmDeposit(request);
    const saberFarmService = new SaberFarmService();
    Promise.resolve(saberFarmService.deposit(params))
      .then((instructionsAndSigners) => {
        log('Farm deposit instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async farmWithdraw(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeFarmWithdraw(request);
    const saberFarmService = new SaberFarmService();
    Promise.resolve(saberFarmService.withdraw(params))
      .then((instructionsAndSigners) => {
        log('Farm withdraw instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }

  async farmHarvest(request: e.Request, response: e.Response, next: e.NextFunction) {
    const params = deserializeFarmHarvest(request);
    const saberFarmService = new SaberFarmService();
    Promise.resolve(saberFarmService.harvest(params))
      .then((instructionsAndSigners) => {
        log('Farm harvest instruction/signers generated');
        response.status(200).send(serializeInstructionsAndSigners(instructionsAndSigners));
      })
      .catch(next);
  }
}

export default new SaberController();

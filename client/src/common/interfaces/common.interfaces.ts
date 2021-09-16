import { Method } from 'axios';
import { IDEXOrderFE } from '@/common/interfaces/dex/common.interfaces.dex.order';

export type BrickPayload = IDEXOrderFE;

export interface IConfiguredBrick {
  id: number,
  method: Method,
  path: string,
  payload: BrickPayload,
}

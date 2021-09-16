import resolveConfig from 'tailwindcss/resolveConfig.js';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);

interface IAction {
  id: number,
  name: string,
  path: string,
  method: string,
}

interface IProtocol {
  id: number,
  name: string,
  color: string,
  logo: string,
  actions: IAction[]
}

const protocols: IProtocol[] = ([
  {
    id: 0,
    name: 'Serum',
    color: fullConfig.theme.colors.db.serum,
    logo: '@/assets/protocols/serumlogo.svg',
    actions: [
      {
        id: 0, name: 'Place order', path: '/serum/orders', method: 'POST',
      },
      {
        id: 1, name: 'Cancel order', path: '/serum/orders/cancel', method: 'POST',
      },
      {
        id: 2, name: 'Initialize market', path: '/serum/markets', method: 'POST',
      },
    ],
  },
  {
    id: 1,
    name: 'Mango',
    color: fullConfig.theme.colors.db.mango,
    logo: '@/assets/protocols/mangologo.svg',
    actions: [
      {
        id: 0, name: 'Initialize market', path: '/mango/markets', method: 'POST',
      },
    ],
  },
  {
    id: 2,
    name: 'Saber',
    color: fullConfig.theme.colors.db.saber,
    logo: '@/assets/protocols/saberlogo.jpeg',
    actions: [
      {
        id: 0, name: 'Initialize market', path: '/saber/markets', method: 'POST',
      },
    ],
  },
]);

export function listProtocols(): IProtocol[] {
  return protocols;
}

export function getProtocol(protocolId: number): IProtocol {
  return protocols[protocolId];
}

export function getAction(protocolId: number, actionId: number): IAction {
  return protocols[protocolId].actions[actionId];
}

import resolveConfig from 'tailwindcss/resolveConfig.js';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);

interface IAction {
  id: number,
  name: string,
  path: string,
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
      { id: 0, name: 'Initialize market', path: '/serum/markets' },
      { id: 1, name: 'Place order', path: '/serum/orders' },
      { id: 2, name: 'Cancel order', path: '/serum/orders/cancel' },
      { id: 3, name: 'Settle funds', path: '/serum/markets/settle' },
    ],
  },
  {
    id: 1,
    name: 'Mango',
    color: fullConfig.theme.colors.db.mango,
    logo: '@/assets/protocols/mangologo.svg',
    actions: [],
  },
  {
    id: 2,
    name: 'Saber',
    color: fullConfig.theme.colors.db.saber,
    logo: '@/assets/protocols/saberlogo.jpeg',
    actions: [],
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

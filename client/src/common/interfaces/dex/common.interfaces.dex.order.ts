export type side = 'buy' | 'sell';
export type orderType = 'limit' | 'ioc' | 'postOnly' | undefined;

export interface IDEXOrderFE {
  marketName: string,
  side: side,
  price: number,
  size: number,
  orderType: orderType,
}

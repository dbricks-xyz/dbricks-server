export type side = 'buy' | 'sell';
export type orderType = "limit" | "ioc" | "postOnly" | undefined;

export interface Order {
    place: (side: side, price: number, size: number, orderType: orderType) => Promise<string>;
    // todo placeTrigger
    // todo modify
    // todo modifyByClientID
    // todo modifyTrigger
    // todo cancel
    // todo cancelByClientID
    // todo cancelTrigger
    // todo cancelAll
}
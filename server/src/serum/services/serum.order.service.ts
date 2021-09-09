import {Order, side, orderType} from "../../common/interfaces/order.interface";
import {serumTradeAndSettle} from "../logic/serum.order.logic";

class SerumOrderService implements Order {
    async place(side: side, price: number, size: number, orderType: orderType): Promise<string> {
        await serumTradeAndSettle(side, price, size, orderType);
        return Promise.resolve('123');
    }
}

export default new SerumOrderService();
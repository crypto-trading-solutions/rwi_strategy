const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);

module.exports = async function (symbol, price, action) {
    const [openOrdersError, openOrders] = await to(
        binance.getOpenOrders(symbol)
    )
    if (openOrdersError) return { error: openOrdersError };
    console.log('openOrders');
    console.log(openOrders);
    console.log('openOrders');

    for (let i = 0; i < openOrders.length; i++) {
        const dealErrors = await checkDealErrors(openOrders[i], action, symbol);
        if (dealErrors.error) return dealErrors;

        const manageDealsResult = await manageDeals(openOrders[i], action, symbol);

        return manageDealsResult;
    }

    return { code: 'open' };
}

const checkDealErrors = (openOrder, newAction, newSymbol) => {
    if (newAction === 'sell') {
        if (openOrder.symbol === newSymbol && openOrder.side === newAction) {
            return { error: 'This BUY deal is already open', order: openOrder };
        }
    } else if (newAction === 'sell') {
        if (openOrder.symbol === newSymbol && openOrder.side === newAction) {
            return { error: 'This SELL deal is already open', order: openOrder };
        }
    }

    return { success: 'success' };
}

const manageDeals = (openOrder, newAction, newSymbol) => {
    switch(newAction) {
        case 'buy':
            if(openOrder.symbol === newSymbol && openOrder.side === 'sell'){
                return {code: 'closeDeal', order: openOrder};
            }
            break;
        case 'sell':
            if(openOrder.symbol === newSymbol && openOrder.side === 'buy'){
                return {code: 'closeDeal', order: openOrder};
            }
            break;
        default:
            return {code: 'open'};
    }
}
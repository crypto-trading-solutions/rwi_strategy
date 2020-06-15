const to = require('await-to-js').default;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET
});

module.exports = async function (symbol, price, action) {
    const [openOrdersError, openOrders] = await to(
        binance.futuresOpenOrders(symbol)
    )
    if (openOrdersError) return { error: openOrdersError };

    for (let i = 0; i < openOrders.length; i++) {
        const dealErrors = await checkDealErrors(openOrders[i], action, symbol);
        if (dealErrors.error) return dealErrors;

        const manageDealsResult = await manageDeals(openOrders[i], action, symbol);

        return manageDealsResult;
    }

    return { code: 'open' };
}

const checkDealErrors = (openOrder, newAction, newSymbol) => {
    if (newAction === 'BUY') {
        if (openOrder.symbol === newSymbol && openOrder.side === newAction) {
            return { error: 'This BUY deal is already open', order: openOrder };
        }
    } else if (newAction === 'SELL') {
        if (openOrder.symbol === newSymbol && openOrder.side === newAction) {
            return { error: 'This SELL deal is already open', order: openOrder };
        }
    }

    return { success: 'success' };
}

const manageDeals = (openOrder, newAction, newSymbol) => {
    switch(newAction) {
        case 'BUY':
            if(openOrder.symbol === newSymbol && openOrder.side === 'SELL'){
                return {code: 'closeDeal', order: openOrder};
            }
            break;
        case 'SELL':
            if(openOrder.symbol === newSymbol && openOrder.side === 'BUY'){
                return {code: 'closeDeal', order: openOrder};
            }
            break;
        default:
            return {code: 'open'};
    }
}
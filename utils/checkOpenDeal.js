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
        if (action === 'BUY') {
            if (openOrders[i].symbol === symbol && openOrders[i].price != price && openOrders[i].side === action) {
                return { code: 'reopen', order: openOrders[i] };
            } else if (openOrders[i].symbol === symbol && openOrders[i].price === price && openOrders[i].side === action) {
                return { code: 'relevant', order: openOrders[i] };
            }
        } else if (action === 'SELL') {
            if (openOrders[i].symbol === symbol && openOrders[i].price === price && openOrders[i].side === action) {
                return { error: 'This SELL deal is already open', order: openOrders[i] };
            }
        }
    }

    return {code: 'open'};
}
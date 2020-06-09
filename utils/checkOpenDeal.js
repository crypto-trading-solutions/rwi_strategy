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

    if(openOrdersError) return {error: openOrdersError};

    return openOrders;
}
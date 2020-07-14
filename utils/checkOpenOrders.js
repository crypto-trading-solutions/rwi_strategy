const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);

module.exports = async function (symbol) {
    const [openOrdersError, openOrders] = await to(
        binance.getOpenOrders(symbol)
    )
    if (openOrdersError) return { error: openOrdersError };
 
    if(openOrders.length > 0){
        return {error: 'We have opened orders!', orders: openOrders};
    }

    return false;
}
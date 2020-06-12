const to = require('await-to-js').default;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET
});

module.exports = async () => {
    const [futurePositionsError, futurePositions] = await to(
        binance.futuresPositionRisk()
    )
    if(futurePositionsError) return {error: 'Error with getting positions',futurePositionsError};

    const symbolPosition = futurePositions.find(obj => {
        return obj.symbol === 'ETHUSDT'
      })

    return symbolPosition;
}
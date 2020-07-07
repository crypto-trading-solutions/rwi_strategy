const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);
// Codes description
// nop -> no opened positions
// olp -> opened long position
// osp -> opened short position

module.exports = async (symbol) => {
    const [futurePositionsError, futurePositions] = await to(
        binance.futuresPositionRisk()
    )
    if (futurePositionsError) return { error: 'Error with getting positions', futurePositionsError };

    const symbolPosition = futurePositions.find(obj => {
        return obj.symbol === symbol
    })

    if (parseFloat(symbolPosition.positionAmt) === 0) return { code: 'nop' }

    if(parseFloat(symbolPosition.positionAmt) > 0){
        symbolPosition.positionSide = 'buy';
    } else if(parseFloat(symbolPosition.positionAmt) < 0){
        symbolPosition.positionSide = 'sell';
    }

    switch (symbolPosition.positionSide) {
        case 'buy':
            return { code: 'olp', position: symbolPosition }
        case 'sell':
            return { code: 'osp', position: symbolPosition }
    }

    return {error: 'Something went wrong!'};
}
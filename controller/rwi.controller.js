const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const validateData = require("../serializers/TradingViewAlert");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);
const roundDown = require('../utils/roundDown');
const checkOpenOrders = require('../utils/checkOpenOrders');
const tradingConfig = require('../tradingConfig');
const managePositions = require('../utils/managePositions');
const toPrecision = require('../utils/precision');

const makeDealHelperClass = require('../utils/makeDealHelper');
const accounts = require('../accounts');

class RwiController {
    async makeDeal(req, res, next) {
        if (!req.headers.host.includes('localhost')) return res.status(400).send({ error: 'Bad host' });

        console.log('req.body');
        console.log(req.body);
        console.log('req.body');

        const adapterData = new validateData(req.body.Ticker, req.body.Price, req.body.Time, req.body.Strategy, req.body.Action);

        let deposit = process.env.ORDER_SIZE;

        const makeDealHelper = new makeDealHelperClass(adapterData, deposit);

        console.log(accounts);

        /**
        * Build object
        * Set future leverage 
        * Set future margin type
        * Get exchange info
        * Get symbol precisions
        */
        await makeDealHelper.build(accounts);

        // Check open orders. If open orders exist return ERROR, if no open orders return FALSE
        const manageDealResult = await makeDealHelper.checkOpenOrders();

        if (manageDealResult.Error) {
            return res.status(400).send(manageDealResult);
        }

        console.log('manageDealResult');
        console.log(manageDealResult);
        console.log('manageDealResult');

        console.log('makeDealHelper');
        console.log(makeDealHelper);
        console.log('makeDealHelper');

        // This function check given action and open appropriate deal
        // Action       |  OpenedDeal
        // LONG         |  BUY
        // CLOSE_LONG   |  SELL
        // SHORT        |  SELL
        // CLOSE_SHORT  |  BUY
        const makeDealResult = await makeDealHelper.manageDeals();

        if(makeDealResult.Error) return res.status(400).send(makeDealResult);

        return res.status(200).send(makeDealResult);
    }
}


module.exports = new RwiController();
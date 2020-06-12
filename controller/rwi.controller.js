const to = require('await-to-js').default;
const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.APIKEY,
    APISECRET: process.env.APISECRET
});
const roundDown = require('../utils/roundDown');
const manageDeals = require('../utils/manageDeals');

class RwiController {
    async makeDeal(req, res, next) {
        const adapterData = req.body;
        let deposit = '';
        let symbolQuantityPrecision = '';

        await binance.futuresLeverage(adapterData.ticker, 1)
        await binance.futuresMarginType(adapterData.ticker, 'ISOLATED')

        const manageDealResult = await manageDeals(adapterData.ticker, adapterData.price, adapterData.action);

        if (manageDealResult.error) {
            console.log(manageDealResult);
            return res.status(400).send(manageDealResult);
        }

        // Get all futures wallet balance
        const [futuresBalanceError, futuresBalance] = await to(
            binance.futuresBalance()
        )
        if (futuresBalanceError) return res.status(400).send(futuresBalanceError);

        // Get balance for current asset
        for (let i = 0; i < futuresBalance.length; i++) {
            if (futuresBalance[i].asset === 'USDT') {
                deposit = futuresBalance[i].balance;
                break;
            }
        }

        const [futuresExchangeInfoError, futuresExchangeInfo] = await to(
            binance.futuresExchangeInfo()
        )
        if (futuresExchangeInfoError) return res.status(400).send(futuresExchangeInfoError);

        // Get quantity precision for current ticker
        for (let i = 0; i < futuresExchangeInfo.symbols.length; i++) {
            if (futuresExchangeInfo.symbols[i].symbol === adapterData.ticker) {
                symbolQuantityPrecision = futuresExchangeInfo.symbols[i].quantityPrecision;
                break;
            }
        }

        // Count order size for deal
        const orderSize = roundDown(deposit / adapterData.price, symbolQuantityPrecision);

        console.log(manageDealResult.code);
        console.log(orderSize);
        console.log(deposit);
        console.log(futuresExchangeInfo);
        switch (manageDealResult.code) {
            case 'open':
                // Open a deal for current ticker

                // Sell deal doesnt work , need check type of orderSize 
                if (adapterData.action === 'SELL') {
                    const [openSellDealError, openSellDeal] = await to(
                        binance.futuresSell(adapterData.ticker, orderSize, adapterData.price)
                    )
                    if (openSellDealError) return res.status(400).send(openSellDealError);

                    return res.status(200).send(openSellDeal);
                }

                {
                    let [openBuyDealError, openBuyDeal] = await to(
                        binance.futuresBuy(adapterData.ticker, orderSize, adapterData.price)
                    )
                    if (openBuyDealError) return res.status(400).send(openBuyDealError);

                    return res.status(200).send(openBuyDeal);
                }
            case 'closeDeal':
                let [cancelDealError, cancelDeal] = await to(
                    binance.futuresCancel(manageDealResult.order.symbol, { orderId: manageDealResult.order.orderId })
                )
                if (cancelDealError) return res.status(400).send(cancelDealError);

                // Open a deal for current ticker
                if (adapterData.action === 'SELL') {
                    const [openSellDealError, openSellDeal] = await to(
                        binance.futuresSell(adapterData.ticker, orderSize, adapterData.price)
                    )
                    if (openSellDealError) return res.status(400).send(openSellDealError);

                    return res.status(200).send(openSellDeal);
                }

                {
                    let [openBuyDealError, openBuyDeal] = await to(
                        binance.futuresBuy(adapterData.ticker, orderSize, adapterData.price)
                    )
                    if (openBuyDealError) return res.status(400).send(openBuyDealError);

                    return res.status(200).send(openBuyDeal);
                }
        }

        res.status(400).send({ error: 'Error with open deal' });
    }
}

module.exports = new RwiController();
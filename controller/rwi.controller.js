const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const validateData = require("../serializers/TradingViewAlert");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);
const roundDown = require('../utils/roundDown');
const manageDeals = require('../utils/manageDeals');
const tradingConfig = require('../tradingConfig');
const managePositions = require('../utils/managePositions');
const toPrecision = require('../utils/precision');

class RwiController {
    async makeDeal(req, res, next) {
        console.log('req.body');
        console.log(req.body);
        console.log('req.body');

        if(!req.headers.host.includes('localhost')) return res.status(400).send({error: 'Bad host'});

        const adapterData = new validateData(req.body.Ticker, req.body.Price, req.body.Time, req.body.Strategy, req.body.Action);

        let deposit = process.env.ORDER_SIZE;
        let symbolQuantityPrecision = '';
        let symbolPricePrecision = '';

        await binance.futuresLeverage(adapterData.ticker, 1)
        await binance.futuresMarginType(adapterData.ticker, 'ISOLATED')

        const manageDealResult = await manageDeals(adapterData.ticker, adapterData.price, adapterData.action);

        console.log('manageDealResult');
        console.log(manageDealResult);
        console.log('manageDealResult');
        if (manageDealResult.error) {
            return res.status(400).send(manageDealResult);
        }


        // Get all futures wallet balance
        // const [futuresBalanceError, futuresBalance] = await to(
        //     binance.futuresBalance()
        // )
        // if (futuresBalanceError) return res.status(400).send(futuresBalanceError);

        // Get balance for current asset
        // for (let i = 0; i < futuresBalance.length; i++) {
        //     if (futuresBalance[i].asset === 'USDT') {
        //         deposit = futuresBalance[i].balance;
        //         break;
        //     }
        // }

        const [futuresExchangeInfoError, futuresExchangeInfo] = await to(
            binance.exchangeInfo()
        )
        if (futuresExchangeInfoError) return res.status(400).send(futuresExchangeInfoError);

        // Get quantity precision for current ticker
        for (let i = 0; i < futuresExchangeInfo.symbols.length; i++) {
            if (futuresExchangeInfo.symbols[i].symbol === adapterData.ticker) {
                symbolQuantityPrecision = futuresExchangeInfo.symbols[i].quantityPrecision;
                symbolPricePrecision = futuresExchangeInfo.symbols[i].pricePrecision;
                break;
            }
        }

        // Count order size for deal
        const orderSize = await roundDown(deposit / adapterData.price, symbolQuantityPrecision);

        // Do right presicion
        adapterData.price = await toPrecision(adapterData.price, symbolPricePrecision);

        console.log('adapterData');
        console.log(adapterData);
        console.log('adapterData');

        const managePositionsResult = await managePositions(adapterData.ticker);
        if (managePositionsResult.error) return res.status(400).send(managePositionsResult);

        switch (manageDealResult.code) {
            case 'open':
                // Check opened position , if we havent got position we open order
                if (!managePositionsResult.position) {
                    console.log('managePositionsResult.position');
                    console.log(managePositionsResult.position);
                    console.log('managePositionsResult.position');
                    if (adapterData.action === 'sell') {
                        const [openSellDealError, openSellDeal] = await to(
                            binance.createOrder(adapterData.ticker, 'SELL', 'LIMIT', orderSize, adapterData.price)
                        )

                        if (openSellDealError) return res.status(400).send(openSellDealError);

                        console.log('openSellDeal');
                        console.log(openSellDeal);
                        console.log('openSellDeal');

                        return res.status(200).send(openSellDeal);
                    }

                    {
                        let [openBuyDealError, openBuyDeal] = await to(
                            binance.createOrder(adapterData.ticker, 'BUY', 'LIMIT', orderSize, adapterData.price)
                        )
                        console.log('openBuyDeal');
                        console.log(openBuyDeal);
                         console.log('openBuyDeal');
                        if (openBuyDealError) return res.status(400).send(openBuyDealError);

                        return res.status(200).send(openBuyDeal);
                    }
                }
                // If we have opened position , we need at first close current position and open new
                // To close a position with Binance you just need to place an opposite order of the same size as your initial order, 
                // when you "entered that position". 

                let managePositionCodesResult = await this.managePositionCodes(managePositionsResult.position, adapterData, orderSize);

                if (managePositionCodesResult.error) return res.status(400).send(managePositionCodesResult);

                return res.status(200).send(managePositionCodesResult);
            case 'closeDeal':
                {

                    let [cancelDealError, cancelDeal] = await to(
                        binance.cancelAllOrders(manageDealResult.order.symbol)
                    )
                    if (cancelDealError) return res.status(400).send(cancelDealError);

                    if (!managePositionsResult.position) {
                        if (adapterData.action === 'sell') {
                            const [openSellDealError, openSellDeal] = await to(
                                binance.createOrder(adapterData.ticker, 'SELL', 'LIMIT', orderSize, adapterData.price)
                            )
                            if (openSellDealError) return res.status(400).send(openSellDealError);

                            console.log('openSellDeal');
                            console.log(openSellDeal);
                            console.log('openSellDeal');

                            return res.status(200).send(openSellDeal);
                        }

                        {
                            let [openBuyDealError, openBuyDeal] = await to(
                                binance.createOrder(adapterData.ticker, 'BUY', 'LIMIT', orderSize, adapterData.price)
                            )
                            if (openBuyDealError) return res.status(400).send(openBuyDealError);

                            console.log('openBuyDeal');
                            console.log(openBuyDeal);
                            console.log('openBuyDeal');

                            return res.status(200).send(openBuyDeal);
                        }
                    }

                    let managePositionCodesResult = await this.managePositionCodes(managePositionsResult.position, adapterData, orderSize);

                    if (managePositionCodesResult.error) return res.status(400).send(managePositionCodesResult);

                    return res.status(200).send(managePositionCodesResult);
                }

        }

        res.status(400).send({ error: 'Error with app' });

      //  res.status(200).send({success: 'Yes'});
    }


    async managePositionCodes(currentPosition, adapterData, orderSize) {

        if (adapterData.action === currentPosition.positionSide) {
            return { error: 'Position in this side already opened', position: currentPosition };
        }

        switch (currentPosition.positionSide) {
            case 'buy':
                {
                    let [closePositionError, closePosition] = await to(
                        binance.createOrder(adapterData.ticker, 'SELL', 'LIMIT', currentPosition.positionAmt, adapterData.price)
                    )
                    if (closePositionError) return { error: 'Close BUY position error', closePositionError };

                    let [openSellDealError, openSellDeal] = await to(
                        binance.createOrder(adapterData.ticker, 'SELL', 'LIMIT', orderSize, adapterData.price)
                    )
                    console.log('openSellDeal');
                    console.log(openSellDeal);
                    console.log('openSellDeal');
                    if (openSellDealError) return { error: 'Open SELL deal error', openSellDealError };

                    return openSellDeal;
                }
            case 'sell':
                {
                    let [closePositionError, closePosition] = await to(
                        binance.createOrder(adapterData.ticker, 'BUY', 'LIMIT', Math.abs(currentPosition.positionAmt), adapterData.price)
                    )

                    console.log('closePosition');
                    console.log(closePosition);
                    console.log('closePosition');
                    if (closePositionError) return { error: 'Close SELL position error', closePositionError };

                    let [openBuyDealError, openBuyDeal] = await to(
                        binance.createOrder(adapterData.ticker, 'BUY', 'LIMIT', orderSize, adapterData.price)
                    )
                    console.log('openBuyDeal');
                    console.log(openBuyDeal);
                    console.log('openBuyDeal');
                    if (openBuyDealError) return { error: ' Open BUY deal error', openBuyDealError };

                    return openBuyDeal;
                }

        }
    }
}


module.exports = new RwiController();
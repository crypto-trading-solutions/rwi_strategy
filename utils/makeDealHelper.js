const to = require('await-to-js').default;
const util = require('util');

const Binance = require("../serializers/BinanceRequestProvider");

class MakeDealHelper {

    constructor(adapterData, deposit) {
        this.adapterData = adapterData;
        this.deposit = deposit;
        this.binance = null;
        this.symbolQuantityPrecision = null;
        this.symbolPricePrecision = null;
        this.orderSize = null;
        this.price = null;
        this.currentPosition = null;
    }


    /**
    * Build object:
    * |Get exchange info                    |
    * |Set futures leverage                 |
    * |Set futures margin                   |
    * |Get symbol precisions                |
    * |Fix Tradingview data price precision |
    * |Count order size                     |
    * |Check current position               |
    * |Check open orders                    |
    * @param {object} account
    */
    async build(account, next) {
        // Create Binance req provider with account keys
        this.binance = new Binance(account.apiKeys.apiKey, account.apiKeys.secretKey);
        //Get exchange info
        await this.getExchangeInfo();

        await this.binance.futuresLeverage(this.adapterData.ticker, 1)
        await this.binance.futuresMarginType(this.adapterData.ticker, 'ISOLATED')
        // Precisions info for ticker
        await this.getSymbolPrecisions();
        // Bring the price to the correct precision, because Trading View sometimes send it with extra decimals 
        await this.fixTradingviewDataPricePrecision();
        // Count order amount 
        await this.countOrderSize();
        // Check current position if exists
        await this.checkCurrentPosition();
        // Check open orders if exists
        await this.checkOpenOrders();

    }

    /**
    * Check current position for given symbol
    * @param {string} ticker
    */
    async checkCurrentPosition() {
        const [futurePositionsError, futurePositions] = await to(
            this.binance.futuresPositionRisk()
        )
        if (futurePositionsError)
            throw new Error(`checkCurrentPosition error: ${futurePositionsError}`);

        const symbolPosition = futurePositions.find(obj => {
            return obj.symbol === this.adapterData.ticker;
        })

        console.log('---------symbolPosition-----------');
        console.log(symbolPosition);
        console.log('---------symbolPosition-----------');

        if (parseFloat(symbolPosition.positionAmt) == 0) {
            return this.currentPosition = null;
        }
        else if (parseFloat(symbolPosition.positionAmt) > 0) {
            console.log('checkCurrentPosition: currently open position - LONG');
            return this.currentPosition = 'long';
        }
        else if (parseFloat(symbolPosition.positionAmt) < 0) {
            console.log('checkCurrentPosition: currently open position - SHORT');
            return this.currentPosition = 'short'
        }

        return;
    }

    /**
    * Format adapterData.price
    */
    async fixTradingviewDataPricePrecision() {
        const adapterData_price_str = this.adapterData.price.toString();
        const dotIndex = adapterData_price_str.indexOf('.');

        // adapterData_price_str - Integer type 
        if (dotIndex == -1) {
            return this.price = adapterData_price_str;
        }
        else {
            // Cut all after symbolPricePrecision
            return this.price = adapterData_price_str.slice(0, dotIndex + this.symbolPricePrecision + 1);
        }
    }

    /**
    * Count order size
    */
    async getExchangeInfo() {
        const [futuresExchangeInfoError, futuresExchangeInfo] = await to(
            this.binance.exchangeInfo()
        )
        if (futuresExchangeInfoError) return res.status(400).send(futuresExchangeInfoError);

        return this.futuresExchangeInfo = futuresExchangeInfo;
    }

    /**
    * Get quantity precision and price precision for the current ticker
    * @param {object} futuresExchangeInfo
    * @param {string} ticker
    */
    async getSymbolPrecisions() {
        const symbolInfo = this.futuresExchangeInfo.symbols.find(elem => elem.symbol == this.adapterData.ticker);
        if (symbolInfo !== undefined) {
            this.symbolQuantityPrecision = symbolInfo.quantityPrecision;
            this.symbolPricePrecision = symbolInfo.pricePrecision;
        }
        else {
            throw new Error(`Symbol with such ticket - ${this.adapterData.ticker} has not been found`);
        }
    }

    /**
    * Check open orders for given symbol
    * @param {string} ticker
    */
    async checkOpenOrders() {
        const [openOrdersError, openOrders] = await to(
            this.binance.getOpenOrders(this.adapterData.ticker)
        )
        if (openOrdersError) throw new Error(`checkOpenOrders error: ${openOrdersError}`);

        if (openOrders.length > 0)
            throw new Error(`checkOpenOrders error:opened orders detected on:${this.adapterData.ticker}\norders: ${util.inspect(openOrders)}`);

        return;
    }

    /**
    * Count order size with round down
    * @param {integer} number
    * @param {integer} decimals
    */
    async countOrderSize() {
        const decimals = this.symbolQuantityPrecision || 0;
        const number = this.deposit / this.price;

        const calculatedOrderSize = Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
        if (calculatedOrderSize !== 0) {
            return this.orderSize = calculatedOrderSize;
        }
        else {
            throw new Error(`countOrderSize Error: It is more likely that, the deposit value / price = ${number} < symbolQuantityPrecision `);
        }
    }

    /**
    *   This function check given action and open appropriate deal:
    *   Action       |  OpenedDeal
    *   long         |  BUY
    *   close_long   |  SELL
    *   short        |  SELL
    *   close_short  |  BUY
    *   @param {integer} number
    *   @param {integer} decimals
    */
    async manageDeals() {
        if (this.currentPosition !== null) {
            if (this.currentPosition === this.adapterData.action)
                throw new Error(`manageDeals error: Position in current side also opened`);

            else if ((this.currentPosition === 'long' && this.adapterData.action === 'short') || (this.currentPosition === 'short' && this.adapterData.action === 'long'))
                throw new Error(`manageDeals error: You need close ${this.currentPosition} if you want open ${this.adapterData.action}`);

            else if ((this.currentPosition === 'long' && this.adapterData.action === 'close_short') || (this.currentPosition === 'short' && this.adapterData.action === 'close_long'))
                throw new Error(`manageDeals error:Current position is ${this.currentPosition}, can't do action: ${this.adapterData.action}`);
        }

        switch (this.adapterData.action) {
            case 'long':
                return this.openBuyDeal();
            case 'short':
                return this.openSellDeal();
            case 'close_short':
                return this.openBuyDeal();
            case 'close_long':
                return this.openSellDeal();
            default:
                throw new Error(`manageDeals error: unknown action - ${this.adapterData.action}`);
        }
    }

    /**
    * Open SELL deal
    */
    async openSellDeal() {
        const [openSellDealError, openSellDeal] = await to(
            this.binance.createOrder(this.adapterData.ticker, 'SELL', 'LIMIT', this.orderSize, this.price)
        )
        if (openSellDealError || openSellDeal.code) throw new Error(`openSellDeal error: ${openSellDealError}`);

        return { Success: 'Sell deal for short position successfully opened', openSellDeal };
    }

    /**
    * Open BUY deal
    */
    async openBuyDeal() {
        const [openBuyDealError, openBuyDeal] = await to(
            this.binance.createOrder(this.adapterData.ticker, 'BUY', 'LIMIT', this.orderSize, this.price)
        )
        if (openBuyDealError || openBuyDeal.code) throw new Error(`openSellDeal error:\nopenBuyDealError: ${openBuyDealError}\nopenBuyDeal.code: ${openBuyDeal.code}`);

        return { Success: 'Buy deal for long position successfully opened', openBuyDeal };
    }

}

module.exports = MakeDealHelper;
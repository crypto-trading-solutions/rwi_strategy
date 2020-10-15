const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");

class MakeDealHelper {

    constructor(adapterData, deposit) {
        this.adapterData = adapterData;
        this.deposit = deposit;
        this.binance = null;

        this.symbolQuantityPrecision = 0;
        this.symbolPricePrecision = 0;

        this.orderSize = 0;
        this.price = 0;

        this.currentPosition = null;
    }


    /**
    * Build object
    * Set future leverage 
    * Set future margin type
    * Get exchange info
    * Get symbol precisions
    * @param {object} account
    */
    async build(account, next) {
        // Create Binance req provider with account keys
        this.binance = new Binance(account.apiKeys.apiKey, account.apiKeys.secretKey);
        
        await this.getExchangeInfo();

        await this.binance.futuresLeverage(this.adapterData.ticker, 1)
        await this.binance.futuresMarginType(this.adapterData.ticker, 'ISOLATED')

        await this.getSymbolPrecisions();

        // Bring the price to the correct precision, because Trading View sometimes send it with extra decimals 
        await this.fixTradingviewDataPricePrecision();

        await this.countOrderSize();

        // Check current position
        await this.checkCurrentPosition();
    }

    /**
    * Check current position for given symbol
    * @param {string} ticker
    */
    async checkCurrentPosition() {
        const [futurePositionsError, futurePositions] = await to(
            this.binance.futuresPositionRisk()
        )
        if (futurePositionsError) return { error: 'Error with getting positions', futurePositionsError };

        const symbolPosition = futurePositions.find(obj => {
            return obj.symbol === this.adapterData.ticker;
        })

        console.log('symbolPosition');
        console.log(symbolPosition);
        console.log('symbolPosition');

        if (parseFloat(symbolPosition.positionAmt) == 0) return this.currentPosition = false;

        if (parseFloat(symbolPosition.positionAmt) > 0) {
            console.log('long');
            return this.currentPosition = 'long';
        } else if (parseFloat(symbolPosition.positionAmt) < 0) {
            console.log('short');
            return this.currentPosition = 'short'
        }

        return null;
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
        if (openOrdersError) return { Error: openOrdersError };

        if (openOrders.length > 0) {
            return { Error: 'We have opened orders!', orders: openOrders };
        }

        return false;
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
    * Open deal for given action
    * @param {integer} number
    * @param {integer} decimals
    */
    async manageDeals() {
        if (this.currentPosition === this.adapterData.action) return { Error: 'Position in current side also opened' };
        if ((this.currentPosition === 'long' && this.adapterData.action === 'short') || (this.currentPosition === 'short' && this.adapterData.action === 'long'))
            return { Error: `You need close ${this.currentPosition} if you want open ${this.adapterData.action}` };
        if ((this.currentPosition === 'long' && this.adapterData.action === 'close_short') || (this.currentPosition === 'short' && this.adapterData.action === 'close_long'))
            return { Error: `Current position is ${this.currentPosition}, you can't do this action: ${this.adapterData.action}` };

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
                return { Error: 'Something went wrong with action' }
        }
    }

    /**
    * Open SELL deal
    * @param {integer} number
    * @param {integer} decimals
    */
    async openSellDeal() {
        const [openSellDealError, openSellDeal] = await to(
            this.binance.createOrder(this.adapterData.ticker, 'SELL', 'LIMIT', this.orderSize, this.price)
        )
        if (openSellDealError || openSellDeal.code) return { Error: 'Error with open sell deal for short position', openSellDeal, openBuyDealError };

        return { Success: 'Sell deal for short position successfully opened', openSellDeal };
    }

    /**
    * Open BUY deal
    * @param {integer} number
    * @param {integer} decimals
    */
    async openBuyDeal() {
        const [openBuyDealError, openBuyDeal] = await to(
            this.binance.createOrder(this.adapterData.ticker, 'BUY', 'LIMIT', this.orderSize, this.price)
        )
        if (openBuyDealError || openBuyDeal.code) return { Error: 'Error with open buy deal for long position', openBuyDeal, openBuyDealError };

        return { Success: 'Buy deal for long position successfully opened', openBuyDeal };
    }

}

module.exports = MakeDealHelper;
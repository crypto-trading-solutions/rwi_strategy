const to = require('await-to-js').default;
const Binance = require("../serializers/BinanceRequestProvider");
const binance = new Binance(process.env.APIKEY, process.env.APISECRET);

class MakeDealHelper {

    constructor(adapterData, deposit) {
        this.adapterData = adapterData;
        this.deposit = deposit;

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
    */
    async build() {
        await binance.futuresLeverage(this.adapterData.ticker, 1)
        await binance.futuresMarginType(this.adapterData.ticker, 'ISOLATED')

        await this.getExchangeInfo();
        await this.getSymbolPrecisions();

        await this.countOrderSize();

        // Bring the price to the correct precision, because Trading View sometimes send price like 229.400000002
        await this.toPrecision();

        // Check current position
        await this.checkCurrentPosition();
    }

    /**
    * Check current position for given symbol
    * @param {string} ticker
    */
    async checkCurrentPosition() {
        const [futurePositionsError, futurePositions] = await to(
            binance.futuresPositionRisk()
        )
        if (futurePositionsError) return { error: 'Error with getting positions', futurePositionsError };
    
        const symbolPosition = futurePositions.find(obj => {
            return obj.symbol === this.adapterData.ticker;
        })
    
        if (parseFloat(symbolPosition.positionAmt) === 0) return false;
    
        if(parseFloat(symbolPosition.positionAmt) > 0){
            this.currentPosition = 'long';
        } else if(parseFloat(symbolPosition.positionAmt) < 0){
            this.currentPosition = 'short'
        }

        return null;
    }

    /**
    * Count order size
    */
    async toPrecision() {
        const str = this.adapterData.price.toString();
        const dotIndex = str.indexOf('.');

        if (dotIndex == -1) this.price = this.adapterData.price;

        // Plus 1, because JS start count symbols from 0
        return this.price = str.slice(0, dotIndex + this.symbolQuantityPrecision + 1);
    }

    /**
    * Count order size
    */
    async getExchangeInfo() {
        const [futuresExchangeInfoError, futuresExchangeInfo] = await to(
            binance.exchangeInfo()
        )
        if (futuresExchangeInfoError) return res.status(400).send(futuresExchangeInfoError);

        return this.futuresExchangeInfo = futuresExchangeInfo;
    }

    /**
    * Get quantity precision and price precision for current ticker
    * @param {object} futuresExchangeInfo
    * @param {string} ticker
    */
    async getSymbolPrecisions() {
        for (let i = 0; i < this.futuresExchangeInfo.symbols.length; i++) {
            if (this.futuresExchangeInfo.symbols[i].symbol === this.adapterData.ticker) {
                this.symbolQuantityPrecision = this.futuresExchangeInfo.symbols[i].quantityPrecision;
                this.symbolPricePrecision = this.futuresExchangeInfo.symbols[i].pricePrecision;
                break;
            }
        }
    }

    /**
    * Check open orders for given symbol
    * @param {string} ticker
    */
    async checkOpenOrders() {
        const [openOrdersError, openOrders] = await to(
            binance.getOpenOrders(this.adapterData.ticker)
        )
        if (openOrdersError) return { error: openOrdersError };

        if (openOrders.length > 0) {
            return { error: 'We have opened orders!', orders: openOrders };
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
        const number = this.deposit / this.symbolQuantityPrecision;

        return this.orderSize = (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
    }

    /**
    * Open deal for given action
    * @param {integer} number
    * @param {integer} decimals
    */
    async manageDeals() {
        if(this.currentPosition === this.adapterData.action) return {Error: 'Position in current side also opened'};

        switch(this.adapterData.action){
            case 'long':
                return this.openBuyDeal();
            case 'short':
                return this.openSellDeal();
            case 'close_short':
                return this.openBuyDeal();
            case 'close_long':
                return this.openSellDeal();
            default:
                return {Error: 'Something went wrong with action'}
        }
    }

    /**
    * Open SELL deal
    * @param {integer} number
    * @param {integer} decimals
    */
    async openSellDeal(){
        const [openSellDealError, openSellDeal] = await to(
            binance.createOrder(this.adapterData.ticker, 'SELL', 'LIMIT', this.orderSize, this.price)
        )
        if(openSellDealError) return {Error: 'Error with open sell deal for short position', openSellDealError};    

        return {Success: 'Sell deal for short position successfully opened', openSellDeal};
    }

    /**
    * Open BUY deal
    * @param {integer} number
    * @param {integer} decimals
    */
   async openBuyDeal(){
    const [openBuyDealError, openBuyDeal] = await to(
        binance.createOrder(this.adapterData.ticker, 'BUY', 'LIMIT', this.orderSize, this.price)
    )
    if(openBuyDealError) return {Error: 'Error with open buy deal for long position', openBuyDealError};    

    return {Success: 'Buy deal for long position successfully opened', openBuyDeal};
}

}

module.exports = MakeDealHelper;
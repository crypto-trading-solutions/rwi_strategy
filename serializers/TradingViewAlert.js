/**
 * Alert object serializer
 * Getting data from TradingView alert webook, serialize it, and validate
 * @param {string} Ticker
 * @param {float} Price
 * @param {date} Time
 * @param {string} Strategy
 * @param {action} Action 
*/
class TradingViewAlert {

    constructor(ticker, price, time, strategy, action){
        this.errors = new Map([
            ['ticker', 'Ticker is not provided or has invalid value'],
            ['price', 'Price is not provided or has invalid value'],
            ['time', 'Time is not provided or has invalid value'],
            ['strategy', 'Strategy is not provided or has invalid value'],
            ['action', 'Action is not provided or has invalid value']
        ]);
    
        this.availableActions = ['long', 'short', 'close_long', 'close_short'];
        this.availableStrategy = 'rwi';

        this.validateTicker(ticker);
        this.validatePrice(parseFloat(price));
        this.validateTime(time);
        this.validateStrategy(strategy);
        this.validateAction(action);
    }

    validateTicker(ticker)  {
        if(!ticker) throw new Error(this.errors.get('ticker'));
        else this.ticker = ticker;
    }

    validatePrice(price) {
        if(!price || price < 0) throw new Error(this.errors.get('price'));
        else this.price = price;
    }

    validateTime(time) {
        if(!time) throw new Error(this.errors.get('time'));
        else this.time = time;
    }

    validateStrategy(strategy) {
        if(!strategy || this.availableStrategy !== strategy) 
            throw new Error(this.errors.get('strategy'));
        else this.strategy = strategy;
    }

    validateAction(action) {
        if(!action || !this.availableActions.includes(action))
            throw new Error(this.errors.get('action'));
        else this.action = action;
    }

}


module.exports = TradingViewAlert;
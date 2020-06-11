const crypto = require( 'crypto' );
const fetch = require('node-fetch');
const promisify = require('util').promisify;
const queryBuilder = require('../utils/queryStringBuilder');

/**
 * Binance request object
 * @param {int} timeout
*/
class BinanceRequestProvider {

    base = 'https://api.binance.com/api';
    wapi = 'https://api.binance.com/wapi';
    sapi = 'https://api.binance.com/sapi';

    defaultUserAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
    defaultContentType = 'application/x-www-form-urlencoded';  

    headers = {
        'User-Agent': this.defaultUserAgent,
        'Content-type': this.defaultContentType,
        'X-MBX-APIKEY': ''
    }

    constructor(apiKey, secretKey, timeout){
        this.timeout = timeout || null;
        this.secretKey = secretKey;
        this.headers['X-MBX-APIKEY'] = apiKey;        
    }

    async _signRequest(query){
        const signature = await promisify(crypto.createHmac( 'sha256', this.secretKey).update(query).digest('hex'));
        return query + "&" + signature;
    }



    async openLimitOrder(symbol, price, amount){
        const query = await queryBuilder({symbol, price, amount});
        const signaturedQuery = this._signRequest(query);
        return fetch(`${this.wapi}/openLimitOrder` + signaturedQuery, {headers: this.headers});
    }


}


module.exports = BinanceRequestProvider;
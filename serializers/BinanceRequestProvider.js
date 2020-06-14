
const queryBuilder = require('../utils/queryStringBuilder');
const signRequest = require("../utils/signQueryRequest");
const fetch = require("../utils/fetchRequestWrapper");

class BinanceRequestProvider {
    baseApiUrl = 'https://api.binance.com';

    apiUrl = `${this.baseApiUrl}/api`;
    wapiUrl = `${this.baseApiUrl}/wapi`;
    sapiUrl = `${this.baseApiUrl}/sapi`;
    fapiUrl = `${this.baseApiUrl}/fapi`;

    constructor(apiKey, secretKey){
        this.secretKey = secretKey;
        this.apiKey = apiKey;
        // this.headers['X-MBX-APIKEY'] = apiKey;        
    }

    /**
     * Create a query for futures order
     * @param {string} symbol - Example: LTCBTC
     * @param {string} side - Example: 'BUY' or 'SELL' 
     * @param {string} type - Example: 'LIMIT' or 'LIMIT', etc...
     * @param {string} timeInForce - Example: 'GTC' or 'GTX'
     * @param {integer} quantity - Example: 1
     * @param {float} price - Example: 0.1
     * Type: POST
     * APIURL: POST /api/v3/order
     * @return {Promise<HttpRequest>}
     */
    async futuresOrder(symbol, side, type, quantity, price, timeInForce = 'GTX'){
        const query = await queryBuilder({symbol, side, type, timeInForce, quantity, price});
        const signaturedQuery = await signRequest(query);
        return fetch(`${this.apiUrl}/v3/order` + signaturedQuery, 'POST', this.apiKey);
    }


    /**
     * Get exchange info from Binance API
     * Type: POST
     * APIURL: POST /api/v3/exchangeInfo
     * @return {Promise<HttpRequest>}
     */
    async futuresExchangeInfo(){
        return fetch(`${this.apiUrl}/v3/exchangeInfo`, 'GET', this.apiKey);
    }



    /**
     * Get opened orders by currency pair
     * @param {string} symbol - Example: LTCBTC
     * Type: POST
     * APIURL: POST /api/v3/openOrders
     * @return {Promise<HttpRequest>}
     */
    async futuresOpenOrders(symbol){
        const query = await queryBuilder({symbol});
        return fetch(`${this.apiUrl}/v3/openOrders` + query, 'GET', this.apiKey);
    }


    /**
     * Change user's initial leverage of specific symbol market.
     * @param {string} symbol - Example: LTCBTC
     * @param {integer} leverage - Target initial leverage: int from 1 to 125 
     * Type: POST
     * APIURL: POST /fapi/v1/leverage
     * @return {Promise<HttpRequest>}
     */
    async futuresLeverage(symbol, leverage){
        const query = await queryBuilder({symbol, leverage});
        const signaturedQuery = await signRequest(query);
        return fetch(`${this.fapiUrl}/v1/leverage` + signaturedQuery, 'GET', this.apiKey);
    }


    /**
     * futuresPositionRisk
     * Type: POST
     * APIURL: POST /api/v1/positionRisk
     * @return {Promise<HttpRequest>}
     */
    async futuresPositionRisk(){
        return fetch(`${this.fapiUrl}/v1/positionRisk`, 'POST', this.apiKey);
    }



    /**
     * Change Margin Type
     * @param {string} symbol - Example: LTCBTC
     * @param {enum} marginType - ISOLATED, CROSSED
     * Type: POST
     * APIURL: POST /fapi/v1/marginType
     * @return {Promise<HttpRequest>}
     */
    async futuresMarginType(symbol, marginType){
        const query = await queryBuilder({symbol, marginType});
        const signaturedQuery = await signRequest(query);
        return fetch(`${this.fapiUrl}/v1/marginType` + signaturedQuery, 'POST', this.apiKey);
    }

}


module.exports = BinanceRequestProvider;

const queryBuilder = require('../utils/queryStringBuilder');
const signRequest = require("../utils/signQueryRequest");
const fetch = require("../utils/fetchRequestWrapper");

class BinanceRequestProvider {
    apiUrl = 'https://api.binance.com/api';
    fapiUrl = 'https://fapi.binance.com/fapi';

    // apiUrl = `${this.baseApiUrl}/api`;
    // wapiUrl = `${this.baseApiUrl}/wapi`;
    // sapiUrl = `${this.baseApiUrl}/sapi`;
    

    constructor(apiKey, secretKey){
        this.secretKey = secretKey;
        this.apiKey = apiKey;
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
    async createOrder(symbol, side, type, quantity, price, timeInForce = 'GTX'){
        const query = await queryBuilder({symbol, side, type, timeInForce, quantity, price});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.apiUrl}/v3/order` + signaturedQuery, 'POST', this.apiKey);
    }

    /**
     * Get information about account with balances
     * Type: GET
     * APIURL: GET /api/v3/account
     * @return {Promise<HttpRequest>}
     */
    async accountInfo(){
        const query = await queryBuilder({});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.apiUrl}/v3/order` + signaturedQuery, 'GET', this.apiKey);
    }


    /**
     * Cancel order
     * @param {string} symbol - Example: LTCBTC
     * @param {long} orderId - Not Required
     * @param {string} origClientOrderId - Not Required
     * @param {string} newClientOrderId - Not Required
     * Type: DELETE
     * APIURL: DELETE /api/v3/order
     * @return {Promise<HttpRequest>}
     */
    async cancelOrder(symbol){
        const query = await queryBuilder({symbol});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.apiUrl}/v3/order` + signaturedQuery, 'DELETE', this.apiKey);
    }



    /**
     * Get exchange info from Binance API
     * Type: POST
     * APIURL: POST /api/v3/exchangeInfo
     * CHECKED
     * @return {Promise<HttpRequest>}
     */
    async exchangeInfo(){
        return fetch(`${this.apiUrl}/v3/exchangeInfo`, 'GET', this.apiKey);
    }


    /**
     * Get opened orders by currency pair
     * @param {string} symbol - Example: LTCBTC
     * Type: GET
     * APIURL: GET /api/v3/openOrders
     * https://binance-docs.github.io/apidocs/spot/en/#query-order-user_data
     * CHECKED
     * @return {Promise<HttpRequest>}
     */
    async getOpenOrders(symbol = ''){
        const query = await queryBuilder({symbol});
        return fetch(`${this.apiUrl}/v3/openOrders` + query, 'GET', this.apiKey);
    }



    /**
     * Change user's position mode 
     * (Hedge Mode or One-way Mode) on EVERY symbol
     * @param {string} dualSidePosition - Example: "true": Hedge Mode mode; "false": One-way Mode
     * Type: POST
     * APIURL: POST /fapi/v3/openOrders
     * @return {Promise<HttpRequest>}
     */
    async futuresChangeCurrentPosition(dualSidePosition){
        const query = await queryBuilder({dualSidePosition});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.fapiUrl}/v3/openOrders` + signaturedQuery, 'POST', this.apiKey);
    }


    /**
     * Change user's initial leverage of specific symbol market.
     * @param {string} symbol - Example: LTCBTC
     * @param {integer} leverage - Target initial leverage: int from 1 to 125 
     * Type: POST
     * APIURL: POST /fapi/v1/leverage
     * https://binance-docs.github.io/apidocs/futures/en/#account-information-v2-user_data
     * CHECKED
     * @return {Promise<HttpRequest>}
     */
    async futuresLeverage(symbol, leverage){
        const query = await queryBuilder({symbol, leverage});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.fapiUrl}/v1/leverage` + signaturedQuery, 'POST', this.apiKey);
    }


    /**
     * Get current positions information.
     * @param {string} symbol - Not Required
     * Type: GET
     * APIURL: GET /fapi/v2/positionRisk
     * https://binance-docs.github.io/apidocs/futures/en/#position-information-user_data
     * CHECKED
     * @return {Promise<HttpRequest>}
     */
    async futuresPositionRisk(symbol = ''){
        const query = await queryBuilder({symbol});
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.fapiUrl}/v2/positionRisk` + signaturedQuery, 'GET', this.apiKey);
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
        const signaturedQuery = await signRequest(query, this.secretKey);
        return fetch(`${this.fapiUrl}/v1/marginType` + signaturedQuery, 'POST', this.apiKey);
    }

}


module.exports = BinanceRequestProvider;
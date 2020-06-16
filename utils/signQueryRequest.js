const promisify = require('util').promisify;
const crypto = require('crypto');
const { default: to } = require('await-to-js');
// const promisify = require('util').promisify;

/**
 * Create a signed query string for http request
 * @param {string} query - Query string
 * @param {string} secretKey - Binance User Secret Key
 * @return {string} query string + encrypted query string with binance secret key
 */
const signRequest = async (query, secretKey) => {
    console.log(query);
    
    const signature =  crypto.createHmac('sha256', secretKey).update(query).digest('hex');

    return query + "&" + signature;
}


module.exports = signRequest;


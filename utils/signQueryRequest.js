const promisify = require('util').promisify;
const crypto = require( 'crypto' );

/**
 * Create a signed query string for http request
 * @param {string} query - Query string
 * @param {string} secretKey - Binance User Secret Key
 * @return {string} query string + encrypted query string with binance secret key
 */
const signRequest = async (query, secretKey) => {
    const signature = crypto.createHmac('sha256', secretKey).update(query.substr(1)).digest('hex');
    const signatureQuery = "&" + "signature" + "=" + signature;
    return query + signatureQuery;
}


module.exports = signRequest;


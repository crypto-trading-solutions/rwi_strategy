const promisify = require('util').promisify;
const crypto = require( 'crypto' );

/**
 * Create a signed query string for http request
 * @param {string} query - Query string
 * @param {string} secretKey - Binance User Secret Key
 * @return {string} query string + encrypted query string with binance secret key
 */
const signRequest = async (query, secretKey) => {
    const signature = await promisify(crypto.createHmac('sha256', secretKey).update(query).digest('hex'));
    return query + "&" + signature;
}


module.exports = signRequest;


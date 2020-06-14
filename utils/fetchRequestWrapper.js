const fetch = require('node-fetch');

const fetchRequest = async (url, method, apiKey) => {

    const defaultUserAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
    const defaultContentType = 'application/x-www-form-urlencoded';  

    const headers = {
        'User-Agent': defaultUserAgent,
        'Content-type': defaultContentType,
        'X-MBX-APIKEY': apiKey
    }
    
    const response = await fetch(url, {method, headers});
    return response.json();
}

module.exports = fetchRequest;
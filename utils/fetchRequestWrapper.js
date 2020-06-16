const fetch = require('node-fetch');

const fetchRequest = async (url, method, apiKey) => {

    const defaultUserAgent = 'Mozilla/4.0 (compatible; Node Binance API)';
    const defaultContentType = 'application/x-www-form-urlencoded';

    const headers = {
        'User-Agent': defaultUserAgent,
        'Content-type': defaultContentType,
        'X-MBX-APIKEY': apiKey
    }


    try {
        const request = await fetch(url, { method, headers });
        const response = request;
        console.log(request);
        console.log(response);
        return response;
    } catch (err) {
        console.log(err);
    }


}

module.exports = fetchRequest;
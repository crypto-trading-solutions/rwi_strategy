const queryStringBuilder = async (json) => {
    const timestamp = new Date().getTime();
    const recvWindow = 5000;
    const query = {...json, timestamp, recvWindow};
    const queryStart = "?";

    return queryStart + Object.keys(query)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(query[key]))
        .join('&');
}


module.exports = queryStringBuilder;
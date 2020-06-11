const queryStringBuilder = async (json) => {
    const queryStart = "?";

    return queryStart + Object.keys(json)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(json[key]))
        .join('&');
}


module.exports = queryStringBuilder;
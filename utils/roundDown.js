module.exports = (number, decimals) => {
    decimals = decimals || 0;
    return (Math.floor(number * Math.pow(10, decimals)) / Math.pow(10, decimals));
}
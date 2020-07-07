module.exports = async (price, precision) => {
    const str = price.toString();
    const dotIndex = str.indexOf('.');

    if(dotIndex == -1) return price;

    // Plus 1, because JS start count symbols from 0
    return str.slice(0, dotIndex + precision + 1);
}
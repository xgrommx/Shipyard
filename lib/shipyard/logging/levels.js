module.exports = exports = {
    'NOTSET': 0,
    'DEBUG': 10,
    'INFO': 20,
    'WARNING': 30,
    'ERROR': 40,
    'CRITICAL': 50
};

exports.getLevelName = function getLevelName(number) {
    for (var k in exports) {
        if (exports[k] === number) {
            return k;
        }
    }
};

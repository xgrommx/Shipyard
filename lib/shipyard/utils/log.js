var logger = (typeof console !== 'undefined') && console;
var defaultMethod = 'log';

function log(level, args) {
    if (logger) {
		if (!logger[level]) {
			level = defaultMethod;
		}
		if(logger[level]) {
			logger[level].apply(logger, args);
		}
    }
}
function logger_apply(level) {
    return function() {
        log(level, arguments);
    };
}

module.exports = exports = logger_apply('log');

// private
// to allow tests for now, but eventually there will be a log API
// similar to Python's. See https://github.com/seanmonstar/Shipyard/issues/18
exports._setLogger = function setLogger(_logger) {
    logger = _logger;
};

exports.getLogger = function getLogger(name) {
    return exports;
};

exports.debug = exports.log = logger_apply('debug');
exports.info = logger_apply('info');
exports.warn = exports.warning = logger_apply('warn');
exports.error = exports.critical = logger_apply('error');

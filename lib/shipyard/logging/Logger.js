var Class = require('../class/Class'),
    type = require('../utils/type'),
    substitute = require('../utils/string').substitute,
    assert = require('../error/assert');

var LEVELS = require('./levels');

var SLICE = Array.prototype.slice;

var __loggers = {};
var ROOT = 'root';
var DIVIDER = '.';
var OTHER_DIVIDERS = /\//g;

function getEffectiveParent(name) {
    name = name.replace(OTHER_DIVIDERS, DIVIDER);
    var parts = name.split(DIVIDER);
    if (parts.length > 1) {
        var parent;
        while (!parent && parts.length) {
            parts.pop();
            parent = __loggers[parts.join(DIVIDER)];
        }
        return parent || __loggers[ROOT];
    } else if (parts.length === 1 && name !== ROOT) {
        return __loggers[ROOT];
    }
}

var slice = Array.prototype.slice;
function logAtLevel(level) {
    return function() {
        var args = slice.call(arguments);
        args.unshift(level);
        this.log.apply(this, args);
    };
}

var Logger = new Class({

    _handlers: [],

    _name: null,

    _level: null,

    propagate: true,

    initialize: function Logger(name) {
        if (!name) {
            name = ROOT;
        }
        if (name in __loggers) {
            return __loggers[name];
        }
        __loggers[name] = this;
        this._name = name;
    },

    setLevel: function setLevel(level) {
        level = LEVELS.getLevel(level);
		assert(level != null, 'Cannot set level with provided value:', level);
        this._level = level;
    },

    getEffectiveLevel: function getEffectiveLevel() {
        if (this._level != null) {
            return this._level;
        } else {
            var parent = getEffectiveParent(this._name);
            if (parent) {
                return parent.getEffectiveLevel();
            } else {
                return LEVELS.NOTSET;
            }
        }
    },

    isEnabledFor: function isEnabledFor(level) {
        return level >= this.getEffectiveLevel();
    },

    addHandler: function addHandler(handler) {
        this._handlers.push(handler);
    },

    removeHandler: function removeHandler(handler) {
        var index = this._handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    },

    makeRecord: function makeRecord(name, level, msg, args) {
        // replace {n} in msg using the args array, plus concatenate any
        // args not used for replacing
        var replaceRE = /\\?\{([^{}]+)\}/g;
        var argsCopy = SLICE.call(args);
        var message = String(msg).replace(replaceRE, function(m, key) {
            var ret = args[key];
            delete argsCopy[key];
            return (ret != null) ? ret : '';
        });

        var msgEnd = argsCopy.filter(function(v) { return v != null; }).join(' ');
        if (msgEnd) {
            message += ' ' + msgEnd;
        }
        return {
            name: name,
            level: level,
            levelname: LEVELS.getLevelName(level),
            timestamp: new Date(),
            message: message,
            args: args
        };
    },

    handle: function handle(record) {
        this._handlers.forEach(function(handler) {
            if (record.level >= handler.level) {
                handler.handle(record);
            }
        });

        // if this.propagate, tell our parent
        if (this.propagate) {
            var par = getEffectiveParent(this._name);
            if (par) {
                par.handle(record);
            }
        }

    },

    log: function log(level, msg /*, messageArs... */) {
        // if level >= this.getEffectiveLevel(), tell our handlers
        if (this.isEnabledFor(level)) {
            var record = this.makeRecord(this._name, level, msg, SLICE.call(arguments, 2));
            this.handle(record);
        }
    },

    debug: logAtLevel(LEVELS.DEBUG),
    info: logAtLevel(LEVELS.INFO),
    warn: logAtLevel(LEVELS.WARNING),
    warning: logAtLevel(LEVELS.WARNING),
    error: logAtLevel(LEVELS.ERROR),
    critical: logAtLevel(LEVELS.CRITICAL)

});


for (var k in LEVELS) {
    if (typeof LEVELS[k] === 'number') {
        Logger[k] = Logger.prototype[k] = LEVELS[k];
    }
}

module.exports = Logger;

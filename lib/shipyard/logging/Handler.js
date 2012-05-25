var Class = require('../class/Class');
var Formatter = require('./Formatter');
var LEVELS = require('./levels');

var _defaultFormatter = new Formatter();

var Handler = new Class({

    level: null,

    _formatter: null,

    initialize: function Handler(level) {
        this.level = (level !== undefined) ? LEVELS.getLevel(level) : LEVELS.NOTSET;
    },

    handle: function(record) {
        //TODO: format?
        this.emit(record);
    },

    // sub-classes should override emit, not handle
    emit: function emit(record) {
        throw new Error('Handler.emit must be implemented by sub-classes');
    },

    format: function format(record) {
        var formatter = this._formatter || _defaultFormatter;
        return formatter.format(record);
    },

    setFormatter: function setFormatter(formatter) {
        this._formatter = formatter;
        return this;
    },

    setLevel: function setLevel(level) {
        this.level = LEVELS.getLevel(level);
        return this;
    }

});

module.exports = Handler;

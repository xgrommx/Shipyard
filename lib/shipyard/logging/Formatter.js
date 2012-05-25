var Class = require('../class/Class'),
    substitute = require('../utils/string').substitute,
    date = require('../utils/date');

module.exports = new Class({

    _format: '{message}',

    _datefmt: '{Y}-{m}-{d} {H}:{M}:{S}',

    initialize: function Formatter(format, datefmt) {
        if (format != null) {
            this._format = format;
        }
        if (datefmt != null) {
            this._datefmt = datefmt;
        }
    },

    usesTime: function usesTime() {
        return this._format.indexOf('{date}') !== -1;
    },

    format: function format(record) {
        if (this.usesTime()) {
            record.date = this.formatDate(record);
        }
        return substitute(this._format, record);
    },

    formatDate: function formatDate(record) {
        return date.format(this._datefmt, record.timestamp);
    }

});

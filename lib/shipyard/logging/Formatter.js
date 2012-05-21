var Class = require('../class/Class'),
    substitute = require('../utils/string').substitute;

module.exports = new Class({

    initialize: function Formatter(format) {
        this._format = format || '{message}';
    },

    format: function format(record) {
        return substitute(this._format, record);
    }

});

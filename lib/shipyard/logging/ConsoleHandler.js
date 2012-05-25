/*global console*/
var Class = require('../class/Class'),
    Handler = require('./Handler');

var TRANSLATIONS = {
    'warning': 'warn',
    'critical': 'error',
    'fatal': 'error'
};

module.exports = new Class({

    Extends: Handler,

    emit: function emit(record) {
        if (typeof console === 'undefined') {
            return;
        }
        var method;
        if (record.levelname) {
            method = record.levelname.toLowerCase();
        }

        method = TRANSLATIONS[method] || method;

        if (!(method in console)) {
            method = 'log';
        }

        console[method].call(console, this.format(record));
    }

});

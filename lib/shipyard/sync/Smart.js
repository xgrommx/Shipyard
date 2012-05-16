var Class = require('../class/Class'),
    BackupSync = require('./Backup'),
    ServerSync = require('./Server'),
    BrowserSync = require('./Browser'),
    dom = require('../dom');

module.exports = new Class({

    Extends: BackupSync,

    options: {
        main: ServerSync,
        backup: BrowserSync
    },

    _isMainAvailable: function _isMainAvailable() {
        return dom.window.get('navigator').onLine;
    },

    _watchAvailability: function _watchAvailability() {
        var sync = this;
        dom.window.addListener('online', function() {
            sync._syncToMain();
        });
    }

});

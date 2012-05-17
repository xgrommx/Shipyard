var Class = require('../class/Class'),
    Store = require('../class/Store'),
    Sync = require('./Sync'),
    assert = require('../error/assert'),
    dom = require('../dom');


var MAIN = 'main';
//var BACKUP = 'backup';
var COMMANDS = 'commands';
var BACKUP = COMMANDS;


var Backup = module.exports = new Class({

    Extends: Sync,

    Implements: Store,

    
    options: {
        main: null,
        backup: null
    },

    initialize: function SmartSync(options) {
        this.parent(options);

        var Main = this.getOption('main');
        var Backup = this.getOption('backup');

        assert(!!Main, 'BackupSync requires a "main" sync option.');
        assert(!!Backup, 'BackupSync requires a "backup" sync option.');

        this.store(MAIN, new Main(options));
        //this.store(BACKUP, new Backup(options));
        this.store(COMMANDS, new Backup({
            table: this.options.table + ':__commands'
        }));

        this._watchAvailability();

        if (this._isMainAvailable()) {
            this._syncToMain();
        }
    },

    create: function create(data, callback) {
        if (this._isMainAvailable()) {
            this.retrieve(MAIN).create(data, callback);
        } else {
            //this.retrieve(BACKUP).create(data, callback);
            this.retrieve(COMMANDS).create({
                command: 'create', data: data
            }, callback);
        }
    },

    update: function update(id, data, callback) {
        //TODO: BACKUP might be a create...
        if (this._isMainAvailable()) {
            this.retrieve(MAIN).update(id, data, callback);
        } else {
            //this.retrieve(BACKUP).update(data, callback);
            this.retrieve(COMMANDS).create({
                command: 'update',
                _id: id,
                data: data
            }, callback);
        }
    },

    read: function read(params, callback) {
        if (this._isMainAvailable()) {
            this.retrieve(MAIN).read(params, callback);
        } else {
            //this.retrieve(BACKUP).read(params, callback);
            this.retrieve(COMMANDS).create({
                command: 'read',
                params: params
            }, callback);
        }
    },

    destroy: function destroy(id, callback) {
        //TODO: keep track of the destroy attempt, and do it on MAIN
        //when back this._isMainAvailable()
        if (this._isMainAvailable()) {
            this.retrieve(MAIN).destroy(id, callback);
        } else {
            //this.retrieve(BACKUP).destroy(id, callback);
            this.retrieve(COMMANDS).create({
                command: 'destroy',
                _id: id
            }, callback);
        }
    },

    _syncToMain: function _syncToMain() {
        // We need to find out all the commands that were sent to
        // BACKUP, and make them happen to MAIN now. In order.
        // Afterwards, we should empty out BACKUP/COMMANDS.
        var sync = this;
        this.retrieve(COMMANDS).read({}, function(commands) {
            commands.forEach(sync._syncCommand, sync);
        });
    },

    _syncCommand: function _syncCommand(command) {
        var sync = this;
        function removeCommand() {
            sync.retrieve(COMMANDS).destroy(command.pk);
        }
        switch (command.command) {
            case 'create':
                this.create(command.data, removeCommand);
                break;
            case 'update':
                this.update(command._id, command.data, removeCommand);
                break;
            case 'read':
                this.read(command.params, removeCommand);
                break;
            case 'destroy':
                this.destroy(command._id, removeCommand);
                break;
        }
    },

    _isMainAvailable: function _isMainAvailable() {
        //TODO: should this log a warning that it should be overridden?
        return true;
    },

    _watchAvailability: function _watchAvailability() {
        //TODO: log warning to override this?
    }

});

Backup.MAIN = MAIN;
Backup.BACKUP = BACKUP;

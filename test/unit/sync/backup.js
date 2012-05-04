var Class = require('../../../lib/shipyard/class/Class'),
    Store = require('../../../lib/shipyard/class/Store'),
    Sync = require('../../../lib/shipyard/sync/Sync'),
    BackupSync = require('../../../lib/shipyard/sync/Backup'),
    SmartSync = require('../../../lib/shipyard/sync/Smart'),
    Spy = require('../../../lib/shipyard/test/Spy');


function MockSync() {
    return {
        create: new Spy(),
        update: new Spy(),
        read: new Spy(),
        destroy: new Spy()
    };
}

function noop() {}

module.exports = {

    'BackupSync': function(it, setup) {

        var sync;
        setup('beforeEach', function() {
            sync = new BackupSync({
                main: MockSync,
                backup: MockSync,
                route: 'mock'
            });
        });

        it('should use main when available', function(expect) {
            sync._isMainAvailable = function() { return true; };
            
            sync.create({}, noop);
            sync.read({}, noop);
            sync.update(1, {}, noop);
            sync.destroy(1, noop);

            var main = sync.retrieve(BackupSync.MAIN);
            expect(main.create).toHaveBeenCalled();
            expect(main.update).toHaveBeenCalled();
            expect(main.read).toHaveBeenCalled();
            expect(main.destroy).toHaveBeenCalled();
        });

        it('should use backup when main not available', function(expect) {
            sync._isMainAvailable = function() { return false; };
            
            sync.create({}, noop);
            sync.read({}, noop);
            sync.update(1, {}, noop);
            sync.destroy(1, noop);

            var backup = sync.retrieve(BackupSync.BACKUP);
            expect(backup.create).toHaveBeenCalled();
            expect(backup.update).toHaveBeenCalled();
            expect(backup.read).toHaveBeenCalled();
            expect(backup.destroy).toHaveBeenCalled();
        });



        it('should send to main at first startup', function(expect) {
            var S = new Class({
                Extends: BackupSync,
                options: {
                    main: MockSync,
                    backup: MockSync
                },
                initialize: function(options) {
                    this._syncToMain = new Spy();
                    this.parent();
                }
            });

            var s = new S();
            expect(s._syncToMain).toHaveBeenCalled();
        });
    },

    'BackupSync.syncToMain': function(it, setup) {

        var id = 1;
        var MemorySync = new Class({
            
            Extends: Sync,

            Implements: Store,

            initialize: function(options) {
                this.parent(options);
                this.store('data', {});
            },

            create: function(data, callback) {
                var store = this.retrieve('data');
                data.pk = id++;
                store[data.pk] = data;
                if (callback) {
                    callback();
                }
            },

            update: function(id, data, callback) {
                var store = this.retrieve('data');
                store[id] = data;
                if (callback) {
                    callback();
                }
            },

            read: function(params, callback) {
                // ???
                var ret = [];
                var data = this.retrieve('data');
                for (var k in data) {
                    ret.push(data[k]);
                }
                if (callback) {
                    callback(ret);
                }
            },

            destroy: function(id, callback) {
                var store = this.retrieve('data');
                delete store[id];
                if (callback) {
                    callback();
                }
            }
        
        });

        it('should create on main when it becomes available', function(expect) {
            var sync = new BackupSync({
                main: MemorySync,
                backup: MemorySync,
                route: 'a'
            });
            var main = sync.retrieve(BackupSync.MAIN);
            var backup = sync.retrieve(BackupSync.BACKUP);

            var isMainAvailable = false;
            sync._isMainAvailable = function() {
                return isMainAvailable;
            };

            var data = { foo: 'bar' };
            var data2 = { herp: 'derp' };

            sync.create(data);
            sync.create(data2);
            expect(main.retrieve('data')).toBeSimilar({});
            
            isMainAvailable = true;
            sync._syncToMain();

            expect(main.retrieve('data')).toHaveProperty(data.pk);
            expect(main.retrieve('data')).toHaveProperty(data2.pk);
        });
    },

    'SmartSync': function(it, setup) {
        var dom = require('../../../lib/shipyard/dom');
        var navigator = dom.window.get('navigator');

        setup('afterEach', function() {
            dom.window.removeListeners();
        });

        it('should determine if main is available', function(expect) {
            navigator.online = true;
            var sync = new SmartSync();
            expect(sync._isMainAvailable()).toBe(true);

            navigator.online = false;
            expect(sync._isMainAvailable()).toBe(false);
        });

        it('should watch for availability of online', function(expect) {
            var sync = new SmartSync();
            sync._syncToMain = this.createSpy();

            dom.window.emit('online');

            expect(sync._syncToMain.getCallCount()).toBe(1);
        });
    }

};

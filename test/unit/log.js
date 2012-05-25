var logging = require('../../lib/shipyard/logging'),
    Logger = require('../../lib/shipyard/logging/Logger'),
    Handler = require('../../lib/shipyard/logging/Handler'),
    NullHandler = require('../../lib/shipyard/logging/NullHandler'),
    config = require('../../lib/shipyard/logging/config'),
    Class = require('../../lib/shipyard/class/Class'),
    Spy = require('../../lib/shipyard/test/Spy'),
    string = require('../../lib/shipyard/utils/string');


module.exports = {

    'logging': function(it, setup) {
    
    },

    'Logger': function(it, setup) {
        
        it('should return the same instance for the same name', function(expect) {
            var n = string.uniqueID();
            var a = new Logger(n);
            var a2 = new Logger(n);

            expect(a).toBe(a2);
        });

        it('should have an effective level', function(expect) {
            var n = string.uniqueID();
            var a = new Logger(n);
            a.setLevel('info');

            var n2 = n + '.' + string.uniqueID();
            var b = new Logger(n2);

            expect(b.getEffectiveLevel()).toBe(Logger.INFO);
        });

        it('should propagate', function(expect) {
            // C should propagate to B, but B should not propagate to A,
            // since we set propagate to false.
            var n = string.uniqueID();
            var a = new Logger(n);
            var spyA = this.createSpy();
            a.addHandler({ handle: spyA, level: 0 });

            var n2 = n + '.' + string.uniqueID();
            var b = new Logger(n2);
            b.propagate = false;
            var spyB = this.createSpy();
            b.addHandler({ handle: spyB, level: 0 });

            var n3 = n2 + '.'  +string.uniqueID();
            var c = new Logger(n3);
            var spyC = this.createSpy();
            c.addHandler({ handle: spyC, level: 0 });


            c.log(Logger.DEBUG, 'one');

            expect(spyA).not.toHaveBeenCalled();
            expect(spyB).toHaveBeenCalled();
            expect(spyC).toHaveBeenCalled();

        });

        it('should substitute extra arguments', function(expect) {
            var n = string.uniqueID();
            var a = new Logger(n);
            a.propagate = false;
            var spy = this.createSpy();
            a.addHandler({ level: 0, handle: spy });

            a.info('foo{0}baz', 'bar');
            expect(spy.getLastArgs()[0].message).toBe('foobarbaz');
            a.info('foobaz', 'bar');
            expect(spy.getLastArgs()[0].message).toBe('foobaz bar');
            a.info('foo{0}baz', 'bar', 'quux');
            expect(spy.getLastArgs()[0].message).toBe('foobarbaz quux');
        });

    },

    'Handler': function(it, setup) {
        
        it('should receive log records', function(expect) {
            var n = string.uniqueID();
            var a = new Logger(n);
            a.propagate = false;
            
            var handler = new Handler();
            handler.emit = this.createSpy();
            a.addHandler(handler);

            a.debug('derp');

            expect(handler.emit).toHaveBeenCalled();
            expect(handler.emit.getLastArgs()[0].message).toBe('derp');
        });
    },

    'config': function(it, setup) {

        var SpyHandler = new Class({
            Extends: Handler,
            initialize: function SpyHandler() {
                this.parent.apply(this, arguments);
                this.emit = new Spy();
            }
        });


        it('should be able to configure logging', function(expect) {
            config({
                formatters: {
                    'basic': {
                        'format': '{message}'
                    },
                    'foo': {
                        'format': 'foo! {levelname}: {message}'
                    }
                },
                handlers: {
                    'null': {
                        'class': SpyHandler,
                        'formatter': 'foo'
                    }
                },
                loggers: {
                    'qqq.zzz': {
                        'level': 'INFO',
                        'propagate': false,
                        'handlers': ['null']
                    }
                }
            });

            var log = logging.getLogger('qqq.zzz');
            //TODO: not touch _private property
            var handler = log._handlers[0];
            expect(log._handlers.length).toBe(1);
            expect(log.propagate).toBeFalse();

            log.debug('asdf');
            expect(handler.emit).not.toHaveBeenCalled();

            log.info('qwer');
            expect(handler.emit).toHaveBeenCalled();
            expect(handler.emit.getLastArgs()[0].message).toBe('qwer');

            var msg = handler.format({ message: 'hi', levelname: 'BAR'});
            expect(msg).toBe('foo! BAR: hi');
        });
    }
};

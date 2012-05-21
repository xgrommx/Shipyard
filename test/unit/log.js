var logging = require('../../lib/shipyard/utils/log');
var Logger = require('../../lib/shipyard/logging/Logger'),
    Handler = require('../../lib/shipyard/logging/Handler'),
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
            expect(handler.emit.getLastArgs()[0].msg).toBe('derp');
        });
    }
};

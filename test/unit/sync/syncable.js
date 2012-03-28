var Class = require('../../../lib/shipyard/class/Class'),
	Sync = require('../../../lib/shipyard/sync/Sync'),
	Syncable = require('../../../lib/shipyard/sync/Syncable'),
	Spy = require('../../testigo/lib/spy').Spy;

module.exports = {

	'Syncable': function(it, setup) {
		
		var MockSync, MockSyncable;

		setup('beforeEach', function() {
			MockSync = new Class({
				Extends: Sync,
				initialize: function(options) {
					this.parent(options);
					this.read = new Spy();
					this.create = new Spy();
					this.update = new Spy();
					this.destroy = new Spy();
				}
			});

			MockSyncable = new Class({
				Implements: Syncable,
                initialize: function(data) {
                    this.data = data;
                }
			});
		});
		
		it('should name Syncs and then use them with the "using" option', function(expect) {
			var foo = new MockSync();
			var bar = new MockSync();

			MockSyncable.addSync('foo', foo);
			MockSyncable.addSync('bar', bar);
			MockSyncable.addSync('baz', new MockSync());

			MockSyncable.find({using: 'bar'});

			expect(foo.read.getCallCount()).toBe(0);
			expect(bar.read.getCallCount()).toBe(1);
		});

		it('should use "default" sync if "using" is not provided', function(expect) {
			var foo = new MockSync();
			var bar = new MockSync();

			MockSyncable.addSync('default', foo);
			MockSyncable.addSync('bar', bar);

			MockSyncable.find();

			expect(foo.read.getCallCount()).toBe(1);
			expect(bar.read.getCallCount()).toBe(0);
		});

		it('should use the Sync mutator to add syncs', function(expect) {
			var foo = new MockSync(),
				bar = new MockSync(),
				getFoo = function() { return foo; },
				getBar = function() { return bar; };

			var S = new Class({
				Implements: Syncable,
				Sync: {
					'default': {
						'driver': getFoo
					},
					'bar': {
						'driver': getBar
					}
				}
			});

			S.find();
			S.find({using: 'bar'});

			expect(foo.read.getCallCount()).toBe(1);
			expect(bar.read.getCallCount()).toBe(1);

		});

		it('should fire Class events from instances', function(expect) {
			var classSpy = new Spy(),
				instSpy = new Spy();
			MockSyncable.addListener('foo', classSpy);

			var s = new MockSyncable();
			s.addListener('foo', instSpy);

			s.emit('foo');
			
			expect(instSpy.getCallCount()).toBe(1);
			expect(classSpy.getCallCount()).toBe(1);
		});

        it('should wrap the returned values from find', function(expect){
            var sync = new MockSync();
            sync.read = function(opts, callback) {
                callback([{a: 1}, {a: 2}]);
            };

            MockSyncable.addSync('default', sync);
            MockSyncable.find({callback: function(list) {
                expect(list).toBeAnInstanceOf(Array);
                expect(list[0].data.a).toBe(1);
            }});
        });

        it('should wrap single objects', function(expect) {
            var sync = new MockSync();
            sync.read = function(opts, callback) {
                callback({a: 3});
            };

            MockSyncable.addSync('default', sync);
            MockSyncable.find({callback: function(list){
                expect(list).toBeAnInstanceOf(Array);
                expect(list[0].data.a).toBe(3);
            }});
        });

	},

    'Syncable.pk': function(it, setup) {
        it('should default to id', function(expect) {
            var s = new Syncable({ id: 1 });
            expect(s.get('pk')).toBe(s.get('id'));
        });

        it('should be changeable', function(expect) {
            var Mock = new Class({
                Extends: Syncable,
                pk: 'foo'
            });
            var s = new Mock({ foo: 'bar' });
            var s2 = new Mock({ pk: 'baz' });

            expect(s.get('pk')).toBe('bar');
            expect(s2.get('foo')).toBe('baz');
        });

        it('should emit events for both properties', function(expect) {
            var s = new Syncable();
            var pkSpy = new Spy();
            var idSpy = new Spy();

            s.observe('pk', pkSpy);
            s.observe('id', idSpy);

            s.set('pk', 1);
            expect(pkSpy).toHaveBeenCalled();
            expect(idSpy).toHaveBeenCalled();

            var pkSpy2 = new Spy();
            var idSpy2 = new Spy();

            s.observe('pk', pkSpy2);
            s.observe('id', idSpy2);

            s.set('id', 2);
            expect(pkSpy2).toHaveBeenCalled();
            expect(idSpy2).toHaveBeenCalled();
        });
    }
};


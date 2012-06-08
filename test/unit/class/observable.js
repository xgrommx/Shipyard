var Observable = require('../../../lib/shipyard/class/Observable'),
    Class = require('../../../lib/shipyard/class/Class'),
    Spy = require('../../testigo/lib/spy').Spy;

module.exports = {
    'Observable': function(it, setup) {
        it('should be able to set and get properties', function(expect) {
            var o = new Observable();
            o.set('foo', 'bar');
            expect(o.get('foo')).toBe('bar');
        });

        it('should be able to get from functions', function(expect) {
            var o = new Observable();
            o.fullName = function() {
                return [this.get('first'), this.get('last')].join(' ');
            };

            o.set('first', 'Sean');
            o.set('last', 'McArthur');

            expect(o.get('fullName')).toBe('Sean McArthur');
        });

        it('should be able to take a hash to set data', function(expect) {
            var o = new Observable();
            o.set({ foo: 'bar', baz: 'bad' });
            expect(o.get('foo')).toBe('bar');
            expect(o.get('baz')).toBe('bad');
        });

        it('should fire a propertyChange event when data changes', function(expect) {
            var o = new Observable(),
                spy = new Spy(),
                spy2 = new Spy();
            o.addListener('propertyChange', spy);
            o.addListener('onBadChange', spy2);
            o.set('sup', 'dude');
            o.set('bad', 'mad');
            o.set('bad', 'happy');
            o.set('bad', 'happy');

            expect(spy.getCallCount()).toBe(3);
            expect(spy.getLastArgs()).toBeLike(['bad', 'happy', 'mad']);
            expect(spy2.getCallCount()).toBe(2);
        });

        it('should be able to observe properties', function(expect) {
            var o = new Observable(),
                spy = new Spy();
            o.observe('herp', spy);
            o.set('foo', 'bar');
            o.set('herp', 'derp');

            expect(spy.getCallCount()).toBe(1);
            expect(spy.getLastArgs()).toBeLike(['derp', undefined]);
        });

        it('should be able to observe computed properties', function(expect) {
            var Ex = new Class({
                Extends: Observable,
                bar: Observable.computed(function() {
                    return this.get('foo');
                }, 'foo')
            });

            var ex = new Ex({ foo: 'baz' });
            var spy = new Spy();

            ex.observe('bar', spy);
            ex.set('foo', 'moe');

            expect(spy.getCallCount()).toBe(1);
            expect(spy.getLastArgs()).toBeLike(['moe', 'baz']);
        });

        it('should be able to set computed properties', function(expect) {
            var Ex = new Class({
                Extends: Observable,
                bar: Observable.computed(function(value) {
                    if (arguments.length > 0) {
                        //setter
                        this.set('foo', value);
                    } else {
                        //getter
                        return this.get('foo');
                    }
                }, 'foo')
            });

            var ex = new Ex({ foo: 'baz' });
            var fooSpy = new Spy();
            var barSpy = new Spy();

            ex.observe('foo', fooSpy);
            ex.observe('bar', barSpy);
            ex.set('bar', 'derp');

            expect(ex.get('foo')).toBe('derp');
            expect(fooSpy.getCallCount()).toBe(1);
            expect(barSpy.getCallCount()).toBeTruthy();
        });

		it('should have computed properties cached', function(expect) {
			var ex = new Observable();
			ex.computed = this.createSpy(function() {
				return 'foo';
			});

			expect(ex.get('computed')).toBe('foo');
			expect(ex.get('computed')).toBe('foo');
			
			expect(ex.computed.getCallCount()).toBe(1);
		});

		it('should be able to NOT cache computed properties', function(expect) {
			var ex = new Observable();
			var counter = 1;
			ex.computed = Observable.computed(this.createSpy(function() {
				return counter++;
			})).canCache(false);

			expect(ex.get('computed')).toBe(1);
			expect(ex.get('computed')).toBe(2);

			expect(ex.computed.getCallCount()).toBe(2);
		});

		it('should be able to have aliased properties', function(expect) {
			var A = new Class({
				Extends: Observable,
				foo: '',
				bar: Observable.computed('foo')
			});

			var a = new A();
			a.set('foo', 'baz');
			expect(a.get('bar')).toBe('baz');

			a.set('bar', 'quux');
			expect(a.get('foo')).toBe('quux');
		});

		it('should not Class.wrap computed properties', function(expect) {
			var Cow = new Class({
				Extends: Observable,
				milk: true,
				moo: Observable.computed(function() {
					var fn = function() {};
					// .apply triggers a Class.wrap method...
					fn.apply(this, arguments);
					return this.milk === true;
				}, 'milk')
			});

			var spy = this.createSpy();
			var cow = new Cow();
			cow.observe('moo', spy);
			cow.set('milk', false);

			expect(spy).toHaveBeenCalled();
		});

        it('should assign events for properties starting with "on"', function(expect) {
            var spy = new Spy();
            var spy2 = new Spy();
            var Ex = new Class({
                Extends: Observable,
                onEv: spy
            });
            var ex = new Ex({
                onFoo: spy2
            });
            ex.emit('ev');
            ex.emit('foo');

            expect(spy).toHaveBeenCalled();
            expect(spy2).toHaveBeenCalled();
        });

        it('should deep observe properties', function(expect) {
            var a = new Observable();
            var b = new Observable({ a: a });
            var spy = new Spy();
            b.observe('a', spy);

            a.set('foo', 'bar');
            expect(spy).toHaveBeenCalled();

            var c = new Observable();
            var spy2 = new Spy();
            b.observe('a', spy2);
            b.set('a', c);
            expect(spy2).toHaveBeenCalled();

            var spy3 = new Spy();
            b.observe('a', spy3);

            // a is no longer a prop of b, so it shouldn't care anymore
            a.set('herp', 'derp');
            expect(spy3).not.toHaveBeenCalled();
        });

        it('should be able to not-deep observe', function(expect) {
            var a = new Observable();
            var b = new Observable({ a: a });
            var spy = this.createSpy();
            b.observe('a', spy, false);

            a.set('c', 'd');
            expect(spy).not.toHaveBeenCalled();

            var spy2 = this.createSpy();
            b.observe('a', spy2);
            a.set('f', 'g');
            expect(spy2).toHaveBeenCalled();
            expect(spy).not.toHaveBeenCalled();

            var e = new Observable();
            b.set('a', e);
            expect(spy).toHaveBeenCalled();
        });
    }
};

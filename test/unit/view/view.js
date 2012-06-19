var View = require('../../../lib/shipyard/view/View'),
	Class = require('../../../lib/shipyard/class/Class');

module.exports = {
	
	'View': function(it, setup) {
		
		var MockView;
		setup('beforeEach', function() {
			MockView = new Class({
			
				Extends: View,

				classNames: ['mock-view'],

				attributes: ['data-test']

			});
		});
		
		it('should be able to render', function(expect) {
			var v = new View({ content: 'test' });
			var el = v.toElement();
			expect(el.get('tag')).toBe('span');
			expect(el.get('text').trim()).toBe('test');
		});

		it('should be able to "set" attributes', function(expect) {
			var v = new MockView();
			v.set('data-test', 'hey "dude"');
			
			var el = v.toElement();
			expect(el.get('data-test')).toBe('hey "dude"');
		});

		it('should set attributes after rendered', function(expect) {
			var v = new MockView(),
				el = v.toElement();
			
			v.set('data-test', 'derp');
			expect(el.get('data-test')).toBe('derp');
		});

		it('should combine classNames', function(expect) {
			var v = new MockView({
				'class': 'foo'
			});
			
			var el = v.toElement();

			expect(el.get('class')).toBe('shipyard-view mock-view foo');
		});

		it('should be able to get and set the template function', function(expect) {
			// https://github.com/seanmonstar/Shipyard/issues/39
			var v = new MockView();
			var template = function() { return 'foo'; };

			v.set('template', template);
			expect(v.get('template')).toBe(template);
		});


		it('should have computable classNames', function(expect) {
			var computed = MockView.computed;
			var v = new MockView({
				classNames: ['ex', computed('foo'), computed('bar')],
				foo: false,
				bar: 'baz'
			});

			var el = v.toElement();
			expect(el.hasClass('baz')).toBe(true);
			expect(el.hasClass('foo')).toBe(false);

			v.set({ foo: true, bar: 'quux' });
			expect(el.hasClass('foo')).toBe(true);
			expect(el.hasClass('baz')).toBe(false);
			expect(el.hasClass('quux')).toBe(true);
		});

	}

};

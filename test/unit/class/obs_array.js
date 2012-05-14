var Observable = require('../../../lib/shipyard/class/Observable'),
	ObservableArray = require('../../../lib/shipyard/class/ObservableArray');

module.exports = {
	'ObservableArray': function(it, setup) {

		it('should be an instance of Observable', function(expect) {
			var arr = new ObservableArray();
			expect(arr).toBeAnInstanceOf(Observable);
		});

		it('should be array-like', function(expect) {
			var arr = new ObservableArray(1, 2, 3);
			expect(arr.length).toBe(3);
			expect(arr[0]).toBe(1);
		});

		it('should wrap a native Array', function(expect) {
			var arr = new ObservableArray(['a', 'b', 'c', 'd']);
			expect(arr.length).toBe(4);
			expect(arr[2]).toBe('c');
		});

		it('should have all Array methods', function(expect) {
			var arr = new ObservableArray();

			expect(arr.indexOf(3)).toBe(-1);

			expect(arr.push(3)).toBe(1);
			expect(arr.indexOf(3)).toBe(0);
			
			expect(arr.unshift('foo')).toBe(2);

			expect(arr.shift()).toBe('foo');
			expect(arr.length).toBe(1);

			expect(arr.pop()).toBe(3);
			expect(arr.length).toBe(0);
		});

		it('should be spliceable', function(expect) {
			var arr = new ObservableArray(1, 2, 3, 4, 5);
			var spy = this.createSpy();
			arr.observe('array', spy);

			var ditched = arr.splice(1, 2); // ditch 2 and 3

			expect(SLICE.call(arr)).toBeLike([1, 4, 5]);
			expect(arr.length).toBe(3);
			expect(ditched).toBeLike([2, 3]);

			arr.splice(-1, 1); // ditch the end
			expect(SLICE.call(arr)).toBeLike([1, 4]);

			arr.splice(0, 1, 'a', 'b');
			expect(SLICE.call(arr)).toBeLike(['a', 'b', 4]);
		});

		it('should have observable indices', function(expect) {
			var spy = this.createSpy();
			var arr = new ObservableArray();

			// first in list
			arr.observe('0', spy);
			arr.push('a');
			expect(spy).toHaveBeenCalled();

			var spy2 = this.createSpy();
			arr.observe('0', spy2);
			arr.push('b');

			expect(spy2).not.toHaveBeenCalled();
			arr.shift();
			expect(spy2).toHaveBeenCalled();
		});
	}
};

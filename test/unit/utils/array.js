var array = require('../../../lib/shipyard/utils/array');

module.exports = {

	'array.flatten': function(it, setup) {
		it('should flatten arrays', function(expect) {
			var arr = [1, 2, 3, [4, 5, [6, 7]]];

			expect(array.flatten(arr)).toBeLike([1, 2, 3, 4, 5, 6, 7]);
		});

		it('should flatten with `arguments` type', function(expect) {
			expect(array.flatten([1, 2, arguments])).toBeLike([1, 2, expect]);
		});
	},

    'array.from': function(it, setup) {
        it('should wrap strings', function(expect) {
            expect(array.from('abc')).toBeLike(['abc']);
        });

        it('should wrap numbers', function(expect) {
            expect(array.from(2)).toBeLike([2]);
        });

        it('should wrap functions', function(expect) {
            var fn = function() {};
            expect(array.from(fn)).toBeLike([fn]);
        });

        it('should wrap objects', function(expect) {
            var obj = { foo: 'bar' };
            expect(array.from(obj)).toBeLike([obj]);
        });

        it('should not wrap arrays', function(expect) {
            var a = [];
            var b = [1, 2, 3];

            expect(array.from(a)).toBe(a);
            expect(array.from(b)).toBe(b);
        });

        it('should slice objects that have a length property', function(expect) {
            // this includes `arguments`
            var obj = { '0': 'foo', '1': 'bar', 'length': 2 };
            expect(array.from(obj)).toBeLike(['foo', 'bar']);
        });
    }

};

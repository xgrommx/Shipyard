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
	}

};

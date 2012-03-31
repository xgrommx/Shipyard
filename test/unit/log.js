var logging = require('../../lib/shipyard/utils/log');
var Logger = require('../../lib/shipyard/logging/Logger'),
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
			var n2 = n + '/' + string.uniqueID();
			var a = new Logger(n);
			a.setLevel('info');

			var b = new Logger(n2);

			expect(b.getEffectiveLevel()).toBe(Logger.INFO);
		});

	}
};

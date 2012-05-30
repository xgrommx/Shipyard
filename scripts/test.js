/*global process: true*/
var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync, // path deprecated in v0.6
	Testigo = require('../test/testigo').Testigo;

function namespace(prefix, module) {
	if (!prefix) {
		return module;
	}
	var obj = {};
	prefix += ': ';
	for (var k in module) {
		obj[prefix+k] = module[k];
	}
	return obj;
}

exports.load = function load(dir, casesArgs, prefix) {
	var cases = [];
	if (!casesArgs || !casesArgs.length) {
		casesArgs = fs.readdirSync(dir);
	} else {
		casesArgs = casesArgs.map(function(c) {
			c = String(c);
			if (!~c.indexOf('.js') && !existsSync(path.join(dir, c))) {
				return c + '.js';
			}
			return c;
		});
	}
	casesArgs.forEach(function(val) {
		var _p = path.join(dir, val);
		if (!existsSync(_p)) {
			console.warn("Test doesn't exist: ", _p);
			return;
		}
		if (path.extname(_p) === '.js' && fs.statSync(_p).isFile()) {
			cases.push(namespace(prefix, require(_p)));
		} else if (fs.statSync(_p).isDirectory()) {
			var _prefix = (prefix ? prefix+': ' : '') + val;
			cases.push.apply(cases, load(_p, null, _prefix));
		}
		
	});
	return cases;
};

exports.run = function(cases, exits) {
	var suite = new Testigo();
	var colors = true;
	var stack = true;
	exits = (exits !== undefined) ? exits : true;

	var runner = new Testigo.Runners.CI(suite, colors, stack, exits);
	//var runner = new Testigo.Runners.Simple('node', suite);

	cases.forEach(function(testCase) {
		for (var description  in testCase) {
			suite.describe(description, testCase[description]);
		}
	});

	runner.run();
};

if (require.main === module) {
	var path = require('path');
	var syPath = path.join(__dirname, '../');
	var pack = require('../');
	var shipyard = pack;
	shipyard.registerExts(pack);
	var shipyardSuite = path.join(syPath, pack.shipyard.test);

	var args = process.argv.slice(2);
	exports.run(exports.load(shipyardSuite, args));
}

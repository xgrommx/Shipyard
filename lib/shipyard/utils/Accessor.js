// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var typeOf = require('./type').typeOf,
	object = require('./object');

module.exports = function(singular, plural) {

	var define = 'define',
		lookup = 'lookup',
		match = 'match',
		each = 'each',
		accessors = '__accessor' + singular,
		matchers = '__matchers' + singular,
        // a prefix to all keys, to prevent name collisions
        // with built-in functions. Specfically,
        // this.lookupAccessor('toString') should not return the native
        // toString method, since it will really look for
        // '__accessor__toString'
        keyPrefix = '__accessor__';

	this[accessors] = {};
	this[matchers]= [];

	if (!plural) {
		plural = singular + 's';
	}

	var defineSingular = this[define + singular] = function(key, value) {
		if (typeOf(key) === 'regexp') {
			this[matchers].push({'regexp': key, 'value': value, 'type': typeOf(value)});
		} else {
			this[accessors][keyPrefix + key] = value;
		}
		return this;
	};

	var definePlural = this[define + plural] = function(object) {
		for (var key in object) {
			this[accessors][keyPrefix + key] = object[key];
		}
		return this;
	};

	var lookupSingular = this[lookup + singular] = function(key) {
		var preffedKey = keyPrefix + key;
        if (preffedKey in this[accessors]) {
			return this[accessors][preffedKey];
		}
		for (var l = this[matchers].length; l--; l) {
			var matcher = this[matchers][l], matched = String(key).match(matcher.regexp);
			if (matched && (matched = matched.slice(1))) {
				return matcher.value;
			}
		}
		return undefined;
	};

	var lookupPlural = this[lookup + plural] = function() {
		var results = {};
		for (var i = 0; i < arguments.length; i++) {
			var argument = arguments[i];
			results[argument] = lookupSingular(argument);
		}
		return results;
	};

	var eachSingular = this[each + singular] = function(fn, bind) {
		object.forEach(this[accessors], fn, bind);
	};

};


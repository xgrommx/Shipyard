var Class = require('../class/Class'),
	type = require('../utils/type'),
	assert = require('../error/assert');

var LEVELS = {
	'NOTSET': 0,
	'DEBUG': 10,
	'INFO': 20,
	'WARNING': 30,
	'ERROR': 40,
	'CRITICAL': 50
};

var __loggers = {};
var ROOT = '__root';
var DIVIDER = '/';

function getEffectiveParent(name) {
	var parts = name.split(DIVIDER);
	if (parts.length > 1) {
		var parent;
		while (!parent && parts.length) {
			parts.pop();
			parent = __loggers[parts.join(DIVIDER)];
		}
		return parent || __loggers[ROOT];
	} else if (parts.length === 1 && name !== ROOT) {
		return __loggers[ROOT];
	}
}

var slice = Array.prototype.slice;
function logAtLevel(level) {
	return function() {
		var args = slice.call(arguments);
		args.unshift(level);
		this.log.apply(this, args);
	};
}

var Logger = new Class({

	_handlers: [],

	_name: null,

	_level: null,

	propagate: true,

	initialize: function Logger(name) {
		if (!name) {
			name = ROOT;
		}
		if (name in __loggers) {
			return __loggers[name];
		}
		__loggers[name] = this;
		this._name = name;
	},

	setLevel: function setLevel(level) {
		if (type.isString(level)) {
			level = LEVELS[level.toUpperCase()];
		}
		assert(level != null, 'Cannot set level with provided value:', level);
		this._level = level;
	},

	getEffectiveLevel: function getEffectiveLevel() {
		if (this._level != null) {
			return this._level;
		} else {
			var parent = getEffectiveParent(this._name);
			if (parent) {
				return parent.getEffectiveLevel();
			} else {
				return LEVELS.NOTSET;
			}
		}
	},

	addHandler: function addHandler(handler) {
		this._handlers.push(handler);
	},

	removeHandler: function removeHandler(handler) {
		var index = this._handlers.indexOf(handler);
		if (index !== -1) {
			this.handlers.splice(index, 1);
		}
	},

	log: function log(level /*, messageArs... */) {
		// if level >= this.getEffectiveLevel(), tell our handlers
		if (level >= this.getEffectiveLevel()) {
			var args = arguments;
			this._handlers.forEach(function(handler) {
				handler.handle.apply(handler, args);
			});
		}
		
		// if this.propagate, tell our parent
		if (this.propagate) {
			var par = getEffectiveParent(this._name);
			if (par) {
				par.log.apply(par, arguments);
			}
		}
	},

	debug: logAtLevel(LEVELS.DEBUG),
	info: logAtLevel(LEVELS.INFO),
	warn: logAtLevel(LEVELS.WARNING),
	warning: logAtLevel(LEVELS.WARNING),
	error: logAtLevel(LEVELS.ERROR),
	critical: logAtLevel(LEVELS.CRITICAL)

});


for (var k in LEVELS) {
	Logger[k] = LEVELS[k];
}

module.exports = Logger;

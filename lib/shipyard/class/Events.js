// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('./Class'),
	assert = require('../error/assert'),
	logging = require('../logging'),
	typeOf = require('../utils/type').typeOf,
	overloadSetter = require('../utils/function').overloadSetter;

var log = logging.getLogger('shipyard.class.Events');

function Listener(obj, evt, fn) {
	return {
		attach: function attach() {
			obj.addListener(evt, fn);
			return this;
		},
		detach: function detach() {
			obj.removeListener(evt, fn);
			return this;
		}
	};
}

function removeOn(string) {
	return string.replace(/^on([A-Z])/, function(full, first) {
		return first.toLowerCase();
	});
}

function getListenerIndex(events, fn) {
	var index = -1;
	for (var i = 0, len = events.length; i < len; i++) {
		if (events[i] && (events[i] === fn || events[i].listener === fn)) {
			index = i;
			break;
		}
	}
	return index;
}

function addListener(evt, fn, internal) {
	assert(typeOf(evt) === 'string', 'Cannot addListener with no type');
	assert(typeOf(fn) === 'function', 'Cannot addListener with no function.');
	evt = removeOn(evt);

	var events = this.__events[evt] = (this.__events[evt] || []);
	var existing = getListenerIndex(events, fn) >= 0;
	if (!existing) {
		events.push(fn);
	} else {
		log.warn('Trying to add duplicate Listener of "{0}" event.', evt);
	}
	return new Listener(this, evt, fn);
}

function removeListener(evt, fn) {
	evt = removeOn(evt);
	
	var events = this.__events[evt];
	if (events) {
		var index = getListenerIndex(events, fn);
		if (index >= 0) {
			delete events[index];
		}
	}
	return this;
}

function removeListeners(events) {
	if (typeOf(events) === 'object') {
		for (var key in events) {
			this.removeListener(key, events[key]);
		}
	} else {
		if (events) {
			events = removeOn(events);
			this.__events[events] = [];
		} else {
			this.__events = {};
		}
		return this;
	}
}

function emit(evt) {
	evt = removeOn(evt);

	var events = this.__events[evt];
	if (!events) {
		return this;
	}

	var args = [].slice.call(arguments, 1);

	events.forEach(function forEachHandler(fn) {
		fn.apply(this, args);
	}, this);
	
	return this;
}

function useAddListener(evt, fn) {
	return this.addListener(evt, fn);
}

function useRemoveListener(evt, fn) {
	return this.removeListener(evt, fn);
}

var EventEmitter = module.exports = new Class({
	
	__events: {},
	addListener: addListener,
	addListeners: overloadSetter(useAddListener),
	once: function once(evt, fn) {
		var emitter = this;
		function one() {
			fn.apply(emitter, arguments);
			emitter.removeListener(evt, fn);
		}

		one.listener = fn;
		return this.addListener(evt, one);
	},
	removeListener: removeListener,
	removeListeners: removeListeners,
	emit: emit

});

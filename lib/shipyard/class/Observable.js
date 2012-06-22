var Class = require('./Class'),
	Events = require('./Events'),
	Binding = require('./Binding'),
	Store = require('./Store'),
	logging = require('../logging'),
	Accessor = require('../utils/Accessor'),
	assert = require('../error/assert'),
	func = require('../utils/function'),
	string = require('../utils/string'),
	object = require('../utils/object'),
	type = require('../utils/type');

var log = logging.getLogger('shipyard.class.Observable');
var UNIQ = string.uniqueID();
var SLICE = Array.prototype.slice;
var CACHE_KEY = '__cache' + UNIQ;

function cacheFor(obj) {
	var cache = obj.retrieve(CACHE_KEY);
	if (!cache) {
		cache = {};
		obj.store(CACHE_KEY, cache);
	}
	return cache;
}

function unwrap(fn) {
	return fn && (fn.__origin || fn);
}

function isClass(func) {
	return func.prototype instanceof Class;
}

function isCallable(func) {
	return type.isFunction(func) && !isClass(func);
}

function getPropChangeName(propName) {
	return propName + 'Change';
}

var Observable = module.exports = new Class({
	
	Extends: Events,

	Implements: Store,

	__data: {},
	__bindings: [],

	initialize: function Observable(data) {
		this._silent(function() {
            this.set(data);
        });
		this._setupProperties();
	},

	// So, get() is the public API, and simply wraps up the possibility
	// of requesting a single key, or multiple keys.
	//
	// _get() tries to find the property on the object.
	//  By default, _get will look in lookupGetter(), and also for the
	//  property on `this`. If it finds the property, and it is a
	//  function, it will use the function as a getter.
	//
	// __get() is used when _get() doe)n't find an existing property.
	//  It's basically the way to get unknownProperty.
	//  The default is to return this.__data[key];

	get: func.overloadGetter(function get(key) {
		return this._get(String(key));
	}),

	_get: function _get(key) {
		// Try to find a getter method first.
		var getter = this.constructor.lookupGetter(key);
		var args = getter ? [key] : [];
		if (!getter) {
			getter = isCallable(this[key]) && this[key];
		}
		if (getter) {
			// With a getter method, we need to handle caching
			if (unwrap(getter)._noCache) {
				return getter.apply(this, args);
			} else {
				var cache = cacheFor(this);
				return cache[key] || (cache[key] = getter.apply(this, args));
			}
		} else if (key in this) {
			return this[key];
		} else {
			return this.__get(key);
		}
	},

	__get: function __get(key) {
		// getting unknown property
		return this.__data[key];
	},

	// set() is the public API, and it wraps up the ability to set a
	// single key, or multiple keys at the same time.
	//
	// _set() tries to find an existing property to set.
	//  By default, _set() will look in lookupSetter(), as well as for
	//  the property on `this`. If it finds the property, and it is a
	//  function, it will use the function as a setter.
	//
	// __set() is used when _set() doesn't find an existing property.
	// It's basically the way to set unknownProperty.
	//  The default is to set the value on this.__data[key];

	set: func.overloadSetter(function set(key, value) {
		var old = this.get(key);
		this._set(String(key), value);
		var neww = this.get(key);
		if (!this.__isSilent && old !== neww) {
			this.emit('propertyChange', key, neww, old);
		}
	}),

	_set: function _set(key, value) {
		// We've got 3 ways that .set can set content.
		// 1. A match from a previous use of .defineSetter.
		// 2. The property already exists in this.
		// 3. Stored in __data (by method __set).
		
		// always blow out the cache
		// because you can .defineGetter, but not have a Setter, and so
		// when the value is set, the cache needs to be busted.
		var cache = cacheFor(this);
		delete cache[key];

		// check for Binding instances
		if (value instanceof Binding) {
			this.bind(key, value);
			return;
		}

		var setter = this.constructor.lookupSetter(key);
		if (setter) {
			setter.call(this, value, key);
		} else if (key in this) {
			// key is in this, but it's not a function
			if (isCallable(this[key])) {
				this[key](value);
			} else {
				this[key] = value;
			}
		} else {
			this.__set(key, value);
		}
	},

	__set: function __set(key, val) {
		// setting unknown property
		this.__data[key] = val;
	},

	unset: function unset(key) {
		this.set(key, null);
	},

    __isSilent: 0,

    _silent: function _silent(fn) {
        // PRIVATE!!
        // at least until i'm sure this is good idea
        // -------
        // This will let the passed function happen while this model is
        // in silent mode, meaning it wont trigger any propertyChange
        // events, in case you need that.
        this.__isSilent++;
        fn.call(this);
        this.__isSilent--;
        return this;
    },

	getPath: function getPath(path) {
		return object.getPath(this, path);
	},

	setPath: function setPath(path, val) {
		object.setPath(this, path, val);
		return this;
	},

	toJSON: function toJSON() {
		return this.__data;
	},

	// observe will addListener for the change event that is emitted
	// when `prop` changes, plus try to deeply observe that property.
	observe: function observe(prop, handler, goDeep) {
		assert(!!prop, 'Must observe a property string');
		assert(typeof handler === 'function', 'Must observe with a function');
		prop = String(prop); // normalize numeric keys into strings
		// goDeep default is true.
		goDeep = goDeep === undefined ? true : !!goDeep;
		return this._observePath(prop, func.bind(handler, this), goDeep);
	},

	_observePath: function _observePath(path, fn, goDeep) {
		var parts = path.split('.');
		var next = SLICE.call(parts, 1).join('.');
		var observable = this;
		var handle;
		if (next.length) {
			// theres more to the path, so just observe this property so
			// that we can attach deeper observers
			var listener;
			var pathObserver = function pathObserver(newVal, oldVal) {
				if (listener) {
					listener.detach();
				}

				if (newVal instanceof Observable) {
					listener = newVal.observe(next, fn, goDeep);
				} else {
					listener = null;
				}
			};

			var propertyChecker = function propertyChecker(newVal, oldVal) {
				var old = oldVal ? object.getPath(oldVal, next) : undefined;
				var new_ = newVal ? object.getPath(newVal, next) : undefined;
				if (old !== new_) {
					fn(new_, old);
				}
			};

			handle = this._observeProperty(parts[0], function observer() {
				pathObserver.apply(this, arguments);
				propertyChecker.apply(this, arguments);
			}, false);
			pathObserver.call(this, this.get(parts[0]));

			//remember to overload handle.detach() to detach all the
			//deeper observers from this path
			var oldDetach = handle.detach;
			handle.detach = function overloadedDetach() {
				if (listener) {
					listener.detach();
				}
				oldDetach.call(this);
			};
		} else {
			// end of the line, just observe the property
			handle = this._observeProperty(parts[0], fn, goDeep);
		}
		return handle;
	},

	_observeProperty: function _observeProperty(prop, handler, goDeep) {
		if (goDeep) {
			return this._deepObserveAll(prop, handler);
		}
		return this.addListener(getPropChangeName(prop), handler);
	},
	
	// Deeply observes properties that are also observable.
	// Ex:
	//  var a = new Observable();
	//  var b = new Observable();
	//  b.observe('foo', function() { console.log('foo changed' });
	//  b.set('foo', a); // console.log, as expected
	//  a.set('bar', 'baz'); // also console.log
	_deepObserveAll: function _deepObserve(prop, handler) {
		// at .observe(), we need to attach to the current value if it
		// exists
		// and, move our observe each time this property changes
		var observable = this;
		var observer;

		// deepAttacher is the method that will try to observe deeply
		// every time `prop` changes
		function deepAttacher(newVal, oldVal) {
			if (observer) {
				observer.detach();
			}
			if (newVal instanceof Observable) {
				observer = newVal.addListener('propertyChange', function deepHandler() {
					handler.call(observable, newVal);
				});
			} else {
				observer = null;
			}
		}

		// deepListener is the listener that both deep attaches, and
		// triggers the original handler
		function deepListener() {
			deepAttacher.apply(this, arguments);
			handler.apply(this, arguments);
		}

		// deep attach right away, since we want to observe the current
		// value as well
		deepAttacher.call(this, this.get(prop));

		// observe the property with this deep listener, but don't go
		// deep with it, or we'd die of recursion
		var listener = this.observe(prop, deepListener, false);
		var oldDetach = listener.detach;
		listener.detach = function detach() {
			if (observer) {
				observer.detach();
			}
			oldDetach.call(this);
		};

		return listener;
	},

	bind: function bind(propName, binding) {
		if (propName instanceof Observable) {
			return this._deprecatedBind(propName, binding);
		}
		
		assert(binding instanceof Binding, 'Bind requires a Binding instance.');
		this.__bindings.push(binding.clone().to(this, propName).watch());
		return this;
	},

	_deprecatedBind: function _deprecatedBind(obs, map) {
		log.warning('Deprecated: bind() argument signature has changed to bind(propName, aBindingInstance).');
		for (var fromProp in map) {
			var toProp = map[fromProp];
			this.bind(fromProp, obs.binding(toProp));
		}
		return this;
	},

	binding: function binding(propName) {
		return new Binding().from(this, propName);
	},

	_setupProperties: function() {
		var observable = this;

		function setup(name, current, dep) {
			observable.observe(dep, function() {
				var cache = cacheFor(this);
				delete cache[name];

				var updated = this.get(name);
				observable.emit('propertyChange', name, updated, current);
				current = updated;
			});
		}
		for (var key in this) {
			var prop = unwrap(this[key]);
			if (prop && prop.isProperty) {
				var current = this.get(key);
				for (var i = 0; i < prop._keys.length; i++) {
					setup(key, current, prop._keys[i]);
				}
			}
		}
	}

});

function dependsOn() {
	this._keys = SLICE.call(arguments);
	return this;
}

function canCache(bool) {
	this._noCache = typeof bool !== 'undefined' && !bool;
	return this;
}

function alias() {
	return function computedAlias(val) {
		var key = computedAlias._keys[0];
		if (arguments.length === 0) {
			//getter
			return this.getPath(key);
		} else {
			//setter
			this.setPath(key, val);
		}
	};
}

function ComputedProperty(fn) {
	fn.isProperty = true;
	fn.dependsOn = dependsOn;
	fn.canCache = canCache;
	return fn;
}


Observable.computed = function computed(/*fn, dependentKeys... */) {
	var isAlias = !type.isFunction(arguments[0]);
	var keys = SLICE.call(arguments, isAlias ? 0 : 1);
	var fn;
	if (isAlias) {
		assert(keys.length === 1, 'Computed aliases can only depend on 1 key.');
		fn = alias();
	} else {
		fn = arguments[0];
	}
	var prop = ComputedProperty(fn);
	prop.dependsOn.apply(prop, keys);
	return prop;
};

Observable.property = function() {
	log.warn('Observable.property is deprecated. Use Observable.computed instead');
	return Observable.computed.apply(this, arguments);
};

Accessor.call(Observable, 'Getter');
Accessor.call(Observable, 'Setter');

Observable.defineMutator(/^on[A-Z]/, function(handler, eventName) {
	Observable.prototype.addListener.call(this.prototype, eventName, handler);
});

Observable.defineSetter(/^on[A-Z]/, function(fn, eventName) {
	this.addListener(eventName, fn);
});

//A default onPropertyChange event, that will emit on{Name}Change event.
Events.prototype.addListener.call(Observable.prototype, 'propertyChange', function(propName) {
	var eventName = getPropChangeName(propName);
	// slice off the propName
	var args = [eventName].concat(SLICE.call(arguments, 1));
	this.emit.apply(this, args);
});

var Class = require('./Class'),
    Events = require('./Events'),
    Accessor = require('../utils/Accessor'),
    assert = require('../error/assert'),
    func = require('../utils/function'),
	string = require('../utils/string'),
    type = require('../utils/type');

var uniq = string.uniqueID();

function isClass(func) {
	return func.prototype instanceof Class;
}

function isCallable(func) {
	return type.isFunction(func) && !isClass(func);
}

var Observable = module.exports = new Class({
    
    Extends: Events,

    __data: {},

    initialize: function Observable(data) {
        this._setupProperties();
        this.set(data);
    },

    _get: function _get(key) {
        var getter = this.constructor.lookupGetter(key);
        if (getter) {
            return getter.call(this, key);
		} else if (key in this) {
			getter = this[key];
			if (isCallable(getter)) {
				return getter.call(this);
			} else {
				return getter;
			}
        } else {
			return this.__get(key);
		}
    },

	__get: function __get(key) {
		// getting unknown property
		return this.__data[key];
	},

    get: func.overloadGetter(function get(key) {
        return this._get(String(key));
    }),

    _set: function set(key, value) {
        // We've got 3 ways that .set can set content.
		// 1. A match from a previous use of .defineSetter.
		// 2. The property already exists in this.
		// 3. Stored in __data (by method __set).
		var old = this.get(key);
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
        if (old !== value) {
            this.emit('propertyChange', key, value, old);
        }
        return this;
    },

	__set: function __set(key, val) {
		// setting unknown property
		this.__data[key] = val;
	},

    set: func.overloadSetter(function set(key, value) {
        this._set(String(key), value);
    }),

    unset: function unset(key) {
        this.set(key, null);
    },

    toJSON: function toJSON() {
        return this.__data;
    },

    observe: function observe(prop, handler, goDeep) {
		// goDeep default is true.
		prop = String(prop); // normalize numeric keys into strings
		goDeep = goDeep === undefined ? true : !!goDeep;
		if (goDeep) {
			this._deepObserve(prop);
		}
        return this.addListener('propertyChange', function(key) {
            var args = [].slice.call(arguments);
            // slice the 'key' off, since it's assumed because we're
            // observing only that 'key'.
            if (key === prop) {
                handler.apply(this, args.slice(1));
            }
        });
    },
	
	// Deeply observes properties that are also observable.
	// Ex:
	//	var a = new Observable();
	//	var b = new Observable();
	//	b.observe('foo', function() { console.log('foo changed' });
	//	b.set('foo', a); // console.log, as expected
	//	a.set('bar', 'baz'); // also console.log
	_deepObserve: function _deepObserve(prop) {
		// at .observe(), we need to attach to the current value if it
		// exists
		// and, move our observe each time this property changes
		var observable = this;
		var listenerName = '__' + uniq + '__deep__' + prop;
		var embeddedName = listenerName + '__embedded';
		if (this[listenerName]) {
			// already attached, abort!
			return;
		}

		// set true, so the the use of .observe() below doesn't infinite
		// loop
		this[listenerName] = true;

		var deepListener = function(newVal, oldVal) {
			if (observable[embeddedName] && observable[embeddedName].detach) {
				observable[embeddedName].detach();
			}
			if (newVal instanceof Observable) {
				var listener = newVal.addListener('propertyChange', function() {
					observable.emit('propertyChange', prop, newVal);
				});
				observable[embeddedName] = listener;
			} else {
				delete observable[embeddedName];
			}
		};

		this[listenerName] = this.observe(prop, deepListener);
		deepListener(this.get(prop));
	},

    _setupProperties: function() {
        var observable = this;

        function setup(name, current, dep) {
            observable.observe(dep, function() {
                var updated = this.get(name);
                observable.emit('propertyChange', name, updated, current);
                current = updated;
            });
        }
        for (var key in this) {
            var prop = this[key];
            if (prop && prop.isProperty) {
                var current = this.get(key);
                for (var i = 0; i < prop.keys.length; i++) {
                    setup(key, current, prop.keys[i]);
                }
            }
        }
    }

});

var slice = Array.prototype.slice;
Observable.property = function property(fn /*, dependentKeys... */) {
    var keys = slice.call(arguments, 1);
    assert(keys, "Computed properties require dependent keys to watch.");
	fn.isProperty = true;
	fn.keys = keys;
	return fn;
};

Accessor.call(Observable, 'Getter');
Accessor.call(Observable, 'Setter');

Observable.defineMutator(/^on[A-Z]/, function(handler, eventName) {
    Events.prototype.addListener.call(this.prototype, eventName, handler);
});

Observable.defineSetter(/^on[A-Z]/, function(fn, eventName) {
	this.addListener(eventName, fn);
});

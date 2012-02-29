var Class = require('./Class'),
    Events = require('./Events'),
    Accessor = require('../utils/Accessor'),
    assert = require('../error/assert'),
    func = require('../utils/function'),
    type = require('../utils/type');

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
			return this.__data[key];
		}
    },

    get: func.overloadGetter(function get(key) {
        return this._get(key);
    }),

    _set: function set(key, value) {
        // We've got 3 ways that .set can set content.
		// 1. A match from a previous use of .defineSetter.
		// 2. The property already exists in this.
		// 3. Stored in __data.
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
			this.__data[key] = value;
        }
        if (old !== value) {
            this.emit('change', key, value, old);
        }
        return this;
    },

    set: func.overloadSetter(function set(key, value) {
        this._set(key, value);
    }),

    unset: function unset(key) {
        this.set(key, null);
    },

    observe: function observe(prop, handler) {
        return this.addListener('change', function(key) {
            var args = [].slice.call(arguments);
            // slice the 'key' off, since it's assumed because we're
            // observing only that 'key'.
            if (key === prop) {
                handler.apply(this, args.slice(1));
            }
        });
    },

    _setupProperties: function() {
        var observable = this;

        function setup(name, current, dep) {
            observable.observe(dep, function() {
                var updated = this.get(name);
                observable.emit('change', name, updated, current);
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

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

    // So, get() is the public API, and simply wraps up the possibility
    // of requesting a single key, or multiple keys.
    //
    // _get() tries to find the property on the object.
    //   By default, _get will look in lookupGetter(), and also for the
    //   property on `this`. If it finds the property, and it is a
    //   function, it will use the function as a getter.
    //
    // __get() is used when _get() doesn't find an existing property.
    // It's basically the way to get unknownProperty.
    //   The default is to return this.__data[key];

    get: func.overloadGetter(function get(key) {
        return this._get(String(key));
    }),

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

    // set() is the public API, and it wraps up the ability to set a
    // single key, or multiple keys at the same time.
    //
    // _set() tries to find an existing property to set.
    //   By default, _set() will look in lookupSetter(), as well as for
    //   the property on `this`. If it finds the property, and it is a
    //   function, it will use the function as a setter.
    //
    // __set() is used when _set() doesn't find an existing property.
    // It's basically the way to set unknownProperty.
    //   The default is to set the value on this.__data[key];

    set: func.overloadSetter(function set(key, value) {
        this._set(String(key), value);
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
        var neu = this.get(key);
        if (old !== neu) {
            this.emit('propertyChange', key, neu, old);
        }
        return this;
    },

    __set: function __set(key, val) {
        // setting unknown property
        this.__data[key] = val;
    },

    unset: function unset(key) {
        this.set(key, null);
    },

    toJSON: function toJSON() {
        return this.__data;
    },

    observe: function observe(prop, handler, goDeep) {
        assert(!!prop, 'Must observe a property string');
        assert(typeof handler === 'function', 'Must observe with a function');
        prop = String(prop); // normalize numeric keys into strings
        // goDeep default is true.
        goDeep = goDeep === undefined ? true : !!goDeep;
        if (goDeep) {
            return this._deepObserve(prop, handler);
        }
        return this.addListener('propertyChange', function observedPropertyChange(key) {
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
    //    var a = new Observable();
    //    var b = new Observable();
    //    b.observe('foo', function() { console.log('foo changed' });
    //    b.set('foo', a); // console.log, as expected
    //    a.set('bar', 'baz'); // also console.log
    _deepObserve: function _deepObserve(prop, handler) {
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
                    handler.call(observable, prop, newVal);
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

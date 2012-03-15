(function() {

function _define(module, deps, payload) {
	define.modules[module] = payload;
}

_define.modules = {};
if (window.define) {
	_define.original = window.define;
	_define.modules = _define.original.modules;
}
window.define = _define;


function require(module, callback) {
	var payload = lookup(module) || lookup(normalize(module, 'index'));
	if (!payload && require.original)
		return require.original.apply(window, arguments);
	
	if (callback) callback();

	return payload;
}

require.paths = [];
if (window.require) require.original = window.require;
window.require = require;

function lookup(id) {
	var payload = define.modules[id];
	if (!payload) return null;

	if (typeof payload === 'function') {
		var module = {
			exports: {},
			id: id
		}
		var relativeRequire = function(name) {
			if (name.charAt(0) == '.') name = normalize(dirname(id), name);
			return require.apply(window, arguments);
		};
		relativeRequire.paths = require.paths;
		payload(relativeRequire, module.exports, module);
		define.modules[id] = module;
		return module.exports;
	} else {
		return payload.exports || payload;
	}
}

function normalize(base, path){
	if (path[0] == '/') base = '';
	path = path.split('/').reverse();
	base = base.split('/');
	var last = base.pop();
	if (last && !(/\.[A-Za-z0-9_-]+$/).test(last)) base.push(last);
	var i = path.length;
	while (i--){
		var current = path[i];
		switch (current){
			case '.': break;
			case '..': base.pop(); break;
			default: base.push(current);
		}
	}
	return base.join('/');
};

function dirname(filename) {
    var parts = filename.split('/');
    parts.pop(); //bye filename
    return parts.join('/');
};

})();
define('tasks/index', [], function(require, exports, module){
var TasksController = require('./controllers/TasksController');

var tc = new TasksController();

});
define('tasks/controllers/TasksController', [], function(require, exports, module){
var Class = require('shipyard/class/Class'),
    Observable = require('shipyard/class/Observable');

var Task = require('../models/Task'),
	ListView = require('../views/TaskList'),
    TaskView = require('../views/TaskView'),
	FormView = require('shipyard/view/FormView'),
	ButtonView = require('shipyard/view/ButtonView'),
	TextFieldView = require('shipyard/view/TextFieldView');

module.exports = new Class({

    Extends: Observable,

    tasks: [],

    initialize: function TasksController(options) {
        this.parent(options);
        this.setupUI();
        this.observeTasks();
    },

    setupUI: function() {
        var form = new FormView()
            .addView(new TextFieldView({ name: 'title', placeholder: 'Task title...' }))
            .addView(new ButtonView({ content: 'Add Task' }))
            .attach();

        form.addListener('submit', function() {
            var task = new Task(this.serialize());
            task.save();
        });

        this.list = new ListView({
            empty: 'Add a task with the above form.',
            itemView: TaskView
        }).attach();

        var clearBtn = new ButtonView({ content: 'Clear Completed Tasks' });
        clearBtn.addListener('click', this._onClear.bind(this));
        clearBtn.attach();
    },

    observeTasks: function() {
        var controller = this;

        Task.find({ callback: function(tasks) {
            tasks.forEach(function(t) {
                controller.addTask(t);
            });
        }});

        Task.addListener('save', function(task, isNew) {
            if (isNew) {
                controller.addTask(task);
            }
        });
        Task.addListener('destroy', function(task) {
            controller.removeTask(task);
        });
                
    },

    addTask: function(task) {
        this.tasks.push(task);
        this.list.addItem(task);
        task.addListener('propertyChange', this._onTaskChange);
    },

    removeTask: function(task) {
        var idx = this.tasks.indexOf(task);
        if (idx !== -1) {
            this.tasks.splice(idx, 1);
        }
        this.list.removeItem(task);
        task.removeListener('propertyChange', this._onTaskChange);
    },

    _onClear: function() {
        var completed = this.tasks.filter(function(task) {
            return task.get('isDone');
        });
        completed.forEach(function(task) {
            task.destroy();
        }, this);
    },

    _onTaskChange: function(property, value) {
        this.save();
    }

});

});
define('shipyard/class/Class', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Accessor = require('../utils/Accessor'),
    object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
    func = require('../utils/function'),
    noop = func.noop,
    overloadSetter = func.overloadSetter,
    merge = object.merge,
    extend = object.extend;

function Class(params) {
    function klass() {
        reset(this);
        return this.initialize ? this.initialize.apply(this, arguments) : this;
    }
    if (typeOf(params) === 'function') {
		params = { initialize: params };
	}
    params = params || { initialize: noop };
    
    //Extends "embedded" mutator
    var parent = 'Extends' in params ? params.Extends : Class;
    delete params.Extends;
    if (!parent || (parent !== Class && !(isClass(parent)))) {
        throw new Error('Class must extend from another Class.');
	}
    var proto = reset(object.create(parent.prototype));
    merge(klass, parent); //inherit "static" properties
    klass.prototype = proto;
    klass.prototype.constructor = klass;
    klass.implement = implement;
    mutate(klass, params);
    klass.parent = parent;
    return klass;
}

Class.prototype.parent = function parent() {
    if (!this.__caller) {
		throw new Error('The method "parent" cannot be called.');
	}
    var name = this.__caller.__name,
        parent_ = this.__caller.__owner.parent,
        previous = parent_ ? parent_.prototype[name] : null;
    if (!previous) {
		throw new Error('The method "' + name + '" has no parent.');
	}
    return previous.apply(this, arguments);
};

Class.prototype.toString = function toString() {
    return '[object Class]';
};

var dontMerge = ['constructor', 'parent'];
var dontMutate = ['toString', 'valueOf', 'constructor'];
function mutate(child, parent, nowrap) {
    for (var key in parent) {
        var val = parent[key];
        var mutator = child.lookupMutator(key);
        if (mutator && dontMutate.indexOf(key) === -1) {
            val = mutator.call(child, val, key);
            if (val == null) {
				continue;
			}
        }
        
        if (dontMerge.indexOf(key) !== -1) {
			continue;
		}

        if (!nowrap && typeOf(val) === 'function' && !isClass(val)) {
            val = wrap(child, key, val);
        }

        merge(child.prototype, key, val);
    }
}

var parentPattern = /xyz/.test(function(){var xyz;}) ?
	/\.(parent|call|apply)[\(\.\[]/ :
	null;
function wrap(me, key, fn) {
    if (fn.__origin) {
		fn = fn.__origin;
	}
    if (parentPattern && !parentPattern.test(fn)) {
		return fn;
	}
    var wrapper = extend(function method() {
        var caller = this.caller,
            current = this.__caller;
        this.caller = current;
        this.__caller = wrapper;
        var result = fn.apply(this, arguments);
        this.__caller = current;
        this.caller = caller;
        return result;
    }, { __name: key, __origin: fn, __owner: me });
    return wrapper;
}



var implement = overloadSetter(function implement(key, value) {
    var params = {};
    params[key] = value;
    mutate(this, params);
    return this;
});


function reset(obj) {
    // If someone specifies an object or array in the prototype
    // definition, they probably want each instance to not actually
    // share that object or array. If it is left on the prototype, it
    // would use only one object (yay memory), but would also mean if
    // one instance altered it, it would be altered for all instances
    // (boo confusing).
    for (var key in obj) {
        var value = obj[key];
        switch (typeOf(value)) {
            case 'object':
                obj[key] = reset(object.create(value));
                break;
            case 'array':
                obj[key] = object.clone(value);
                break;
        }
    }
    return obj;
}

function isArray(obj) {
    return obj.length !== null && !~['function', 'string'].indexOf(typeof obj);
}

function isClass(fn) {
	return fn.prototype instanceof Class;
}

Accessor.call(Class, 'Mutator');
Class.defineMutator('Implements', function Implements(mixins) {
    mixins = isArray(mixins) ? mixins : [mixins];
    for (var i = 0, len = mixins.length; i < len; i++) {
        merge(this, mixins[i]);
        mutate(this, object.create(mixins[i].prototype), true);
    }
});

module.exports = Class;

});
define('shipyard/utils/Accessor', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var typeOf = require('./type').typeOf,
	object = require('./object');

module.exports = function(singular, plural) {

	var define = 'define',
        lookup = 'lookup',
        match = 'match',
        each = 'each',
        accessors = '__accesor' + singular,
        matchers = '__matchers' + singular;

	this[accessors] = {};
    this[matchers]= [];

	if (!plural) {
        plural = singular + 's';
    }

	var defineSingular = this[define + singular] = function(key, value) {
		if (typeOf(key) === 'regexp') {
            this[matchers].push({'regexp': key, 'value': value, 'type': typeOf(value)});
        } else {
            this[accessors][key] = value;
        }
		return this;
	};

	var definePlural = this[define + plural] = function(object) {
		for (var key in object) {
            this[accessors][key] = object[key];
        }
		return this;
	};

	var lookupSingular = this[lookup + singular] = function(key) {
		if (key in this[accessors]) {
            return this[accessors][key];
        }
		for (var l = this[matchers].length; l--; l) {
			var matcher = this[matchers][l], matched = key.match(matcher.regexp);
			if (matched && (matched = matched.slice(1))) {
				if (matcher.type === 'function') {
                    return function() {
                        return matcher.value.apply(this, [].slice.call(arguments).concat(matched));
                    };
                } else {
                    return matcher.value;
                }
			}
		}
		return null;
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


});
define('shipyard/utils/type', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var toString = Object.prototype.toString;
var typeCheck = /\[object\s(\w*)\]/;
var toType = function(item) {
	return toString.call(item).replace(typeCheck, '$1').toLowerCase();
};

var typeOf = exports.typeOf = exports.of = function(item) {
	if (item == null) {
		return 'null';
	}
	var type = toType(item);
	if (type !== 'object') {
		return type;
	}

	if (item.nodeName){
		if (item.nodeType === 1) {
			return 'element';
		}
		if (item.nodeType === 3) {
			return (/\S/).test(item.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof item.length === 'number'){
		if (item.callee) {
			return 'arguments';
		}
		if ('item' in item) {
			return 'collection';
		}
	}

	return typeof item;
};

function makeIsMethod(type) {
	return function(value) {
		return typeOf(value) === type;
	};
}

exports.isString = makeIsMethod('string');
exports.isFunction = makeIsMethod('function');
exports.isBoolean = makeIsMethod('boolean');
exports.isNumber = makeIsMethod('number');
exports.isArray = makeIsMethod('array');

});
define('shipyard/utils/object', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net) 
// - MIT Licence
var typeOf = require('./type').typeOf;

exports.extend = function extend(child, parent) {
	for(var i in parent) {
		child[i] = parent[i];
	} 
	return child;
};

var mergeOne = function(source, key, current){
	switch (typeOf(current)){
		case 'object':
			if (typeOf(source[key]) == 'object') mergeObject(source[key], current);
			else source[key] = cloneObject(current);
		break;
		case 'array': source[key] = cloneArray(current); break;
		default: source[key] = current;
	}
	return source;
};

var mergeObject = exports.merge = function merge(source, k, v) {
	if (typeOf(k) == 'string') return mergeOne(source, k, v);
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		for (var key in object) mergeOne(source, key, object[key]);
	}
	return source;
};

var cloneOf = exports.clone = function clone(item) {
	switch (typeOf(item)){
		case 'array': return cloneArray(item);
		case 'object': return cloneObject(item);
		default: return item;
	}
};

var cloneArray = function(arr) {
	var i = arr.length, clone = [];
	while (i--) clone[i] = cloneOf(arr[i]);
	return clone;
};

var cloneObject = function(obj) {
	var clone = {};
	for (var key in obj) clone[key] = cloneOf(obj[key]);
	return clone;
};

exports.forEach = function forEach(obj, fn, bind) {
	for (var key in obj) if (obj.hasOwnProperty(key)) {
		fn.call(bind || obj, obj[key], key, obj);
	}
};

exports.map = function map(obj, fn, bind) {
	var results = {};
	for (var key in obj) results[key] = fn.call(bind || obj, obj[key], key, obj);
	return results;
};

exports.some = function some(obj, fn, bind) {
    for (var key in obj) if (obj.hasOwnProperty(key)) {
        if (fn.call(bind || obj, obj[key], key)) return true;
    }
    return false;
};

exports.every = function every(obj, fn, bind) {
    for (var key in obj) if (obj.hasOwnProperty(key)) {
        if (!fn.call(bind || obj, obj[key], key)) return false;
    }
    return true;
};

exports.create = Object.create || function create(obj) {
	var F = function(){};
	F.prototype = obj;
	return new F;
};

exports.toQueryString = function toQueryString(obj, base) {
	var queryString = [];
	
	exports.forEach(obj, function(value, key) {
		if (value == null) return;
		if (base) key = base + '[' + key + ']';
		var result;
		switch (typeOf(value)) {
			case 'object': 
				result = exports.toQueryString(value, key);
				break;
			case 'array':
				var obj = {};
				for (var i = 0; i < value.length; i++) {
					obj[i] = value[i];
				}
				result = exports.toQueryString(obj, key);
				break;
			default: 
				result = key + '=' + encodeURIComponent(value);
		}
		queryString.push(result);
	});

	return queryString.join('&');
};

});
define('shipyard/utils/function', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var typeOf = require('./type').typeOf;

exports.noop = function noop() {};

// Allows fn(params) -> fn(key, value) for key, value in params
exports.overloadSetter = function(fn) {
	return function overloadedSetter(keyOrObj, value) {
		if (typeOf(keyOrObj) !== 'string') {
			for (var key in keyOrObj) {
				fn.call(this, key, keyOrObj[key]);
			}
		} else {
			fn.call(this, keyOrObj, value);
		}
		return this;
	};
};

// Allows fn(list) -> return fn(key) for key in list
exports.overloadGetter = function(fn) {
    return function overloadedGetter(key) {
        var me = this;
        if (arguments.length > 1) {
            return Array.prototype.map.call(arguments, function(name) {
                return fn.call(me, name);
            });
        } else {
            return fn.call(this, key);
        }
    };
};

// Allows some setup to be called the first. The setup function must
// return a function that will be assigned to same property of the
// object.
exports.lazy = function(obj, key, setup) {
	obj[key] = function() {
		obj[key] = setup.apply(this, arguments);
		obj[key].apply(this, arguments);
	};
};

});
define('shipyard/class/Observable', [], function(require, exports, module){
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
            this.emit('propertyChange', key, value, old);
        }
        return this;
    },

    set: func.overloadSetter(function set(key, value) {
        this._set(key, value);
    }),

    unset: function unset(key) {
        this.set(key, null);
    },

    toJSON: function toJSON() {
        return this.__data;
    },

    observe: function observe(prop, handler) {
        return this.addListener('propertyChange', function(key) {
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

});
define('shipyard/class/Class', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Accessor = require('../utils/Accessor'),
    object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
    func = require('../utils/function'),
    noop = func.noop,
    overloadSetter = func.overloadSetter,
    merge = object.merge,
    extend = object.extend;

function Class(params) {
    function klass() {
        reset(this);
        return this.initialize ? this.initialize.apply(this, arguments) : this;
    }
    if (typeOf(params) === 'function') {
		params = { initialize: params };
	}
    params = params || { initialize: noop };
    
    //Extends "embedded" mutator
    var parent = 'Extends' in params ? params.Extends : Class;
    delete params.Extends;
    if (!parent || (parent !== Class && !(isClass(parent)))) {
        throw new Error('Class must extend from another Class.');
	}
    var proto = reset(object.create(parent.prototype));
    merge(klass, parent); //inherit "static" properties
    klass.prototype = proto;
    klass.prototype.constructor = klass;
    klass.implement = implement;
    mutate(klass, params);
    klass.parent = parent;
    return klass;
}

Class.prototype.parent = function parent() {
    if (!this.__caller) {
		throw new Error('The method "parent" cannot be called.');
	}
    var name = this.__caller.__name,
        parent_ = this.__caller.__owner.parent,
        previous = parent_ ? parent_.prototype[name] : null;
    if (!previous) {
		throw new Error('The method "' + name + '" has no parent.');
	}
    return previous.apply(this, arguments);
};

Class.prototype.toString = function toString() {
    return '[object Class]';
};

var dontMerge = ['constructor', 'parent'];
var dontMutate = ['toString', 'valueOf', 'constructor'];
function mutate(child, parent, nowrap) {
    for (var key in parent) {
        var val = parent[key];
        var mutator = child.lookupMutator(key);
        if (mutator && dontMutate.indexOf(key) === -1) {
            val = mutator.call(child, val, key);
            if (val == null) {
				continue;
			}
        }
        
        if (dontMerge.indexOf(key) !== -1) {
			continue;
		}

        if (!nowrap && typeOf(val) === 'function' && !isClass(val)) {
            val = wrap(child, key, val);
        }

        merge(child.prototype, key, val);
    }
}

var parentPattern = /xyz/.test(function(){var xyz;}) ?
	/\.(parent|call|apply)[\(\.\[]/ :
	null;
function wrap(me, key, fn) {
    if (fn.__origin) {
		fn = fn.__origin;
	}
    if (parentPattern && !parentPattern.test(fn)) {
		return fn;
	}
    var wrapper = extend(function method() {
        var caller = this.caller,
            current = this.__caller;
        this.caller = current;
        this.__caller = wrapper;
        var result = fn.apply(this, arguments);
        this.__caller = current;
        this.caller = caller;
        return result;
    }, { __name: key, __origin: fn, __owner: me });
    return wrapper;
}



var implement = overloadSetter(function implement(key, value) {
    var params = {};
    params[key] = value;
    mutate(this, params);
    return this;
});


function reset(obj) {
    // If someone specifies an object or array in the prototype
    // definition, they probably want each instance to not actually
    // share that object or array. If it is left on the prototype, it
    // would use only one object (yay memory), but would also mean if
    // one instance altered it, it would be altered for all instances
    // (boo confusing).
    for (var key in obj) {
        var value = obj[key];
        switch (typeOf(value)) {
            case 'object':
                obj[key] = reset(object.create(value));
                break;
            case 'array':
                obj[key] = object.clone(value);
                break;
        }
    }
    return obj;
}

function isArray(obj) {
    return obj.length !== null && !~['function', 'string'].indexOf(typeof obj);
}

function isClass(fn) {
	return fn.prototype instanceof Class;
}

Accessor.call(Class, 'Mutator');
Class.defineMutator('Implements', function Implements(mixins) {
    mixins = isArray(mixins) ? mixins : [mixins];
    for (var i = 0, len = mixins.length; i < len; i++) {
        merge(this, mixins[i]);
        mutate(this, object.create(mixins[i].prototype), true);
    }
});

module.exports = Class;

});
define('shipyard/class/Events', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('./Class'),
    assert = require('../error/assert'),
    log = require('../utils/log'),
    typeOf = require('../utils/type').typeOf,
    overloadSetter = require('../utils/function').overloadSetter;

var Listener = new Class({
	
	initialize: function Listener(obj, evt, fn) {
		this._obj = obj;
		this._evt = evt;
		this._fn = fn;
	},

	attach: function attach() {
		this._obj.addListener(this._evt, this._fn);
		return this;
	},

	detach: function detach() {
		this._obj.removeListener(this._evt, this._fn);
	}

});

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
		log.warn('Trying to add duplicate Listener of "%s" event.', evt);
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

    events.forEach(function(fn) {
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

});
define('shipyard/error/assert', [], function(require, exports, module){
var ShipyardError = require('./Error');

module.exports = function assert(expression/*, ...message*/) {
    if (!expression) {
        var args = Array.prototype.slice.call(arguments, 1);
        var message = args.join('');
        throw new ShipyardError(message);
    }
};

});
define('shipyard/error/Error', [], function(require, exports, module){
function prepStack(msg, str) {
    //stack is a string
    var stack = str.split('\n');
    stack[0] = msg;
    stack.splice(1, 1); // remove "new ShipyardError()" line
    return stack.join('\n');
}

function ShipyardError(msg) {
    this.name = 'ShipyardError';
    this.message = msg;
    this.stack = prepStack([this.name, msg].join(': '), new Error().stack);
}

ShipyardError.prototype = new Error();
ShipyardError.prototype.constructor = ShipyardError;

module.exports = ShipyardError;

});
define('shipyard/utils/log', [], function(require, exports, module){
var logger = (typeof console !== 'undefined') && console;
var defaultMethod = 'log';

function log(level, args) {
    if (logger) {
		if (!logger[level]) {
			level = defaultMethod;
		}
		if(logger[level]) {
			logger[level].apply(logger, args);
		}
    }
}
function logger_apply(level) {
    return function() {
        log(level, arguments);
    };
}

module.exports = exports = logger_apply('log');

// private
// to allow tests for now, but eventually there will be a log API
// similar to Python's. See https://github.com/seanmonstar/Shipyard/issues/18
exports._setLogger = function setLogger(_logger) {
    logger = _logger;
};

exports.getLogger = function getLogger(name) {
    return exports;
};

exports.debug = exports.log = logger_apply('debug');
exports.info = logger_apply('info');
exports.warn = exports.warning = logger_apply('warn');
exports.error = exports.critical = logger_apply('error');

});
define('tasks/models/Task', [], function(require, exports, module){
var Class = require('shipyard/class/Class'),
	model = require('shipyard/model'),
	Syncable = require('shipyard/sync/Syncable'),
	BrowserSync = require('shipyard/sync/Browser');

var Task = module.exports = new Class({
	
	Extends: model.Model,

	Implements: Syncable,

	Sync: {
		'default': {
			table: 'tasks',
			driver: BrowserSync
		}
	},
	
	fields: {
		id: model.fields.TextField(),
		title: model.fields.TextField(),
		createdAt: model.fields.DateField(),
		isDone: model.fields.BooleanField({ 'default': false })
	},

	toString: function() {
		return this.get('title');
	}
	
});

});
define('shipyard/model/index', [], function(require, exports, module){
exports.Model = require('./Model');
exports.fields = require('./fields');

});
define('shipyard/model/Model', [], function(require, exports, module){
var Class = require('../class/Class'),
    Syncable = require('../sync/Syncable'),
    ShipyardError = require('../error/Error'),
    overloadSetter = require('../utils/function').overloadSetter,
    object = require('../utils/object');

var UNDEF;

var Model = module.exports = new Class({
    
    Extends: Syncable,
    
    //default to always having an ID field?
    //fields: {},

    pk: 'id',

    initialize: function Model(data) {
        this.parent(data);
        for (var f in this.constructor.__fields) {
            var field = this.constructor.__fields[f];
            if (!field.isField) {
                continue;
            }


            var def = field.getOption('default');
            if (this.get(f) === UNDEF && def != null) {
                this.set(f, def);
            }
        }
    },
    
    _set: function _set(key, value) {
        if (key in this.constructor.__fields && this.constructor.__fields[key].isField) {
            this.parent(key, this.constructor.__fields[key].from(value));
        } else if (key in this) {
            this.parent(key, value);
        }
    },
    
    _get: function _get(key) {
        if ((key in this.constructor.__fields) || (key in this)) {
            return this.parent(key);
        }
        throw new ShipyardError('Accessing undefined field "'+key+'"');
    },

    toJSON: function toJSON() {
        var data = {};
        var fields = this.constructor.__fields;
        for (var key in fields) {
            if (fields[key].isField) {
                data[key] = fields[key].serialize(this.get(key));
            }
        }
        return data;
    },

    toString: function toString() {
        // you should override this, since some Views will cast the
        // Model to a string when rendering
        return '[object Model]';
    }

});

Model.defineSetter('pk', function(pk) {
    this.set(this.pk, pk);
}).defineGetter('pk', function() {
    return this.get(this.pk);
});

Model.__fields = {};

Model.defineMutator('fields', function mutator_fields(fields) {
    object.forEach(fields, function(field, name) {
        this.__fields[name] = field;
    }, this);
});

});
define('shipyard/sync/Syncable', [], function(require, exports, module){
var Class = require('../class/Class'),
	Events = require('../class/Events'),
    Observable = require('../class/Observable'),
	object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
    assert = require('../error/assert'),
	Sync = require('./Sync');

var DEFAULT = 'default';

function getSync(obj, name) {
	var using = name || DEFAULT,
		sync = obj.__syncs[using];
    assert(sync, 'This Syncable does not have a sync named "' + using + '"');
	return sync;
}

var Syncable = new Class({
	
    Extends: Observable,
	
	save: function save(options) {
		options = options || {};

		var id = this.get('pk'),
			isNew = !id;

		this.emit('preSave', isNew);

		var onSave = function onSave(data) {
            this.emit('save', isNew);
		}.bind(this);


		var sync = getSync(this.constructor, options.using);
		if (isNew) {
			sync.create(this, onSave);
		} else {
			sync.update(id, this, onSave);
		}

		return this;
	},

	destroy: function destroy(options) {
		options = options || {};
		
		var id = this.get('pk');
		if (!id) {
			return null;
		}

		this.emit('preDestroy');

		var sync = getSync(this.constructor, options.using);
		sync.destroy(id, function onDelete(id) {
			this.emit('destroy', id);
		}.bind(this));

		return null;
	},

	emit: function emit(evt) {
		// overwrite Syncable.emit so that all events a syncable instances
		// fires can be observed by listening to the syncable Class
		Events.prototype.emit.apply(this, arguments);

		var klass = this.constructor;
		var args = [].slice.call(arguments, 1);
		args.unshift(this);
		args.unshift(evt);

		klass.emit.apply(klass, args);
	}

});

object.extend(Syncable, new Events());
Syncable.parent = Observable;

Syncable.find = function find(options) {
	var klass = this;
	options = options || {};
	function wrap(rows) {
        if (typeOf(rows) !== 'array') {
			rows = [rows];
		}
		return rows.map(function(row) { return new klass(row); });
	}

	var sync = getSync(this, options.using);

	sync.read(options.conditions || {}, function(rows) {
		rows = wrap(rows);
		if (typeof options.callback === 'function') {
			options.callback(rows);
		}
	});
	return this;
};

Syncable.__syncs = {};

Syncable.addSync = function addSync(name, sync) {
	this.__syncs[name] = sync;
	return this;
};

Syncable.removeSync = function removeSync(name) {
	delete this.__syncs[name];
	return this;
};


// Sync mutator

Syncable.defineMutator('Sync', function Sync(syncs) {
	object.forEach(syncs, function(options, name) {
		var klass;
		if (options.driver) {
			klass = options.driver;
			delete options.driver;
		} else {
			klass = options;
			options = null;
		}
		this.addSync(name, new klass(options));
	}, this);
});

module.exports = Syncable;

});
define('shipyard/class/Observable', [], function(require, exports, module){
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
            this.emit('propertyChange', key, value, old);
        }
        return this;
    },

    set: func.overloadSetter(function set(key, value) {
        this._set(key, value);
    }),

    unset: function unset(key) {
        this.set(key, null);
    },

    toJSON: function toJSON() {
        return this.__data;
    },

    observe: function observe(prop, handler) {
        return this.addListener('propertyChange', function(key) {
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

});
define('shipyard/sync/Sync', [], function(require, exports, module){
var Class = require('../class/Class'),
	Options = require('../class/Options');

module.exports = new Class({

	Implements: Options,

	options: {},

	initialize: function(options) {
		this.setOptions(options)
	}

});

});
define('shipyard/class/Options', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('./Class'),
	merge = require('../utils/object').merge,
    func = require('../utils/function'),
    overloadGetter = func.overloadGetter,
	overloadSetter = func.overloadSetter;

var onEventRE = /^on[A-Z]/;

function getOption(name) {
	if (!this.options) {
        return null;
    }
	return this.options[name];
}

function setOption(name, value) {
	if (!this.options) {
        this.options = {};
    }
	if (this.addListener && onEventRE.test(name) && typeof value === 'function') {
		this.addListener(name, value);
	} else {
		merge(this.options, name, value);
	}
	return this;
}

module.exports = new Class({

	getOption: getOption,

    getOptions: overloadGetter(getOption),

	setOption: setOption,
	
	setOptions: overloadSetter(setOption)

});

});
define('shipyard/model/fields/index', [], function(require, exports, module){
exports.Field = require('./Field');
exports.BooleanField = require('./BooleanField');
exports.DateField = require('./DateField');
exports.NumberField = require('./NumberField');
exports.TextField = require('./TextField');

});
define('shipyard/model/fields/Field', [], function(require, exports, module){
var Class = require('../../class/Class'),
    Options = require('../../class/Options');


/*
    Field: all properties on a Model are stored via the help of Fields.
    Data is stored with primitive values, but Fields can convert the data
    to useful data formats.
    
    Example: a DateField could accept a Date with it's setter, converting it
    into a string format that can be saved in a data store. The getter can
    convert the string back into a Date object, so the application can use the
    smartest object format.
*/
module.exports = new Class({
    
    Implements: Options,
    
    options: {
        'default': undefined
    },

    isField: true,
    
    initialize: function(opts) {
        this.setOptions(opts);
    },
    
	// Accepts a raw value, and converts it into a JavaScript value that
	// gets stored on the model, and is returned by model.get(field);
	// 
	// This should be a Date object, instead of the date string, for
	// example.
    from: function(value) {
        return value;
    },
    
	// Accepts a JavaScript value, such as a Date object, and returns a
	// value that can be serialized into JSON.
    serialize: function(value) {
        if (typeof value === 'undefined') value = this.options['default'];
        if (value == null) return value;
        return this.from(value).valueOf();
	}
    
});

});
define('shipyard/model/fields/BooleanField', [], function(require, exports, module){
var Class = require('../../class/Class'),
	Field = require('./Field'),
    typeOf = require('../../utils/type').typeOf;

var BooleanField = new Class({

	Extends: Field,

    from: function(value) {
        // this captures 1 & 0 also
        if (value == true) return true;
        if (value == false) return false;

        if (typeOf(value) == 'string') {
            var lower = value.toLowerCase();
            if (lower == 'true') return true;
            else if (lower == 'false') return false;
        }

        if (value === null) return null;

        //throw new ValidationError('Value must be either true or false')
    }

});

module.exports = function(options) {
	return new BooleanField(options);
};

});
define('shipyard/model/fields/DateField', [], function(require, exports, module){
var Class = require('../../class/Class'),
	Field = require('./Field'),
    typeOf = require('../../utils/type').typeOf;

var bigDateFormat = /(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?/;
var toInt = function(x) { return parseInt(x || 0, 10); };

var DateField = new Class({

	Extends: Field,

    from: function(value) {
        if (value == null) return null;
        if (value instanceof Date) return value;
        
		var type = typeOf(value);
		if (type === 'number') return new Date(value);

		var match;
		if (type === 'string' && (match = value.match(bigDateFormat))) {
			return new Date(Date.UTC(match[1], toInt(match[2]) - 1, toInt(match[3]), toInt(match[4]), toInt(match[5]), toInt(match[6])));
		}

        //throw new ValidationError('Value must be a date');
    }

});

module.exports = function(options) {
	return new DateField(options);
};

});
define('shipyard/model/fields/NumberField', [], function(require, exports, module){
var Class = require('../../class/Class'),
	Field = require('./Field');

var NumberField = new Class({
	
	Extends: Field,

    from: function(value) {
        var val = parseInt(value, 10);
        if (!isNaN(val)) return val;
        else if (value == null) return null;
        
        //throw new ValidationError('Value must be numeric');
    }

});

module.exports = function(options) {
	return new NumberField(options);
};

});
define('shipyard/model/fields/TextField', [], function(require, exports, module){
var Class = require('../../class/Class'),
	Field = require('./Field');

var TextField = new Class({

	Extends: Field,

    from: function(value) {
        if (value == null) return null;
        return String(value);
    }

});

module.exports = function(options) {
	return new TextField(options);
};

});
define('shipyard/sync/Syncable', [], function(require, exports, module){
var Class = require('../class/Class'),
	Events = require('../class/Events'),
    Observable = require('../class/Observable'),
	object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
    assert = require('../error/assert'),
	Sync = require('./Sync');

var DEFAULT = 'default';

function getSync(obj, name) {
	var using = name || DEFAULT,
		sync = obj.__syncs[using];
    assert(sync, 'This Syncable does not have a sync named "' + using + '"');
	return sync;
}

var Syncable = new Class({
	
    Extends: Observable,
	
	save: function save(options) {
		options = options || {};

		var id = this.get('pk'),
			isNew = !id;

		this.emit('preSave', isNew);

		var onSave = function onSave(data) {
            this.emit('save', isNew);
		}.bind(this);


		var sync = getSync(this.constructor, options.using);
		if (isNew) {
			sync.create(this, onSave);
		} else {
			sync.update(id, this, onSave);
		}

		return this;
	},

	destroy: function destroy(options) {
		options = options || {};
		
		var id = this.get('pk');
		if (!id) {
			return null;
		}

		this.emit('preDestroy');

		var sync = getSync(this.constructor, options.using);
		sync.destroy(id, function onDelete(id) {
			this.emit('destroy', id);
		}.bind(this));

		return null;
	},

	emit: function emit(evt) {
		// overwrite Syncable.emit so that all events a syncable instances
		// fires can be observed by listening to the syncable Class
		Events.prototype.emit.apply(this, arguments);

		var klass = this.constructor;
		var args = [].slice.call(arguments, 1);
		args.unshift(this);
		args.unshift(evt);

		klass.emit.apply(klass, args);
	}

});

object.extend(Syncable, new Events());
Syncable.parent = Observable;

Syncable.find = function find(options) {
	var klass = this;
	options = options || {};
	function wrap(rows) {
        if (typeOf(rows) !== 'array') {
			rows = [rows];
		}
		return rows.map(function(row) { return new klass(row); });
	}

	var sync = getSync(this, options.using);

	sync.read(options.conditions || {}, function(rows) {
		rows = wrap(rows);
		if (typeof options.callback === 'function') {
			options.callback(rows);
		}
	});
	return this;
};

Syncable.__syncs = {};

Syncable.addSync = function addSync(name, sync) {
	this.__syncs[name] = sync;
	return this;
};

Syncable.removeSync = function removeSync(name) {
	delete this.__syncs[name];
	return this;
};


// Sync mutator

Syncable.defineMutator('Sync', function Sync(syncs) {
	object.forEach(syncs, function(options, name) {
		var klass;
		if (options.driver) {
			klass = options.driver;
			delete options.driver;
		} else {
			klass = options;
			options = null;
		}
		this.addSync(name, new klass(options));
	}, this);
});

module.exports = Syncable;

});
define('shipyard/sync/Browser', [], function(require, exports, module){
var Class = require('../class/Class'),
	Sync = require('./Sync'),
    localStorage = require('../dom/localStorage'),
	string = require('../utils/string'),
	object = require('../utils/object');

var FUNCTION = 'function';

function getTable(name) {
	return JSON.parse(localStorage.getItem(name)) || {};
}

function setTable(name, table) {
	localStorage.setItem(name, JSON.stringify(table));
}

function async(fn, data) {
    setTimeout(function() {
        fn(data);
    }, 13);
}

function returnData(table, id, callback) {
    var store = getTable(table);
    async(callback, store[id]);
}

module.exports = new Class({

	Extends: Sync,

	create: function create(data, callback) {
		var store = getTable(this.options.table),
			id = string.uniqueID();

        data.set('pk', id);

		store[id] = data;
		setTable(this.options.table, store);
		if (typeof callback === FUNCTION) {
            returnData(this.options.table, id, callback);
        }
	},

	update: function update(id, data, callback) {
		var store = getTable(this.options.table);

		store[id] = data;
		setTable(this.options.table, store);
		if (typeof callback === FUNCTION) {
            returnData(this.options.table, id, callback);
        }
	},

	read: function read(params, callback) {
		var store = getTable(this.options.table),
			rows = [];

		object.forEach(store, function(values, id) {
			for (var k in params) {
                if (params.hasOwnProperty(k)) {
                    if (values[k] !== params[k]) {
                        return;
                    }
                }
            }
			values.id = id;
			rows.push(values);
		}, this);

		if (typeof callback === FUNCTION) {
            async(callback, rows);
        }
	},

	destroy: function destroy(id, callback) {
		var store = getTable(this.options.table);

		delete store[id];
		setTable(this.options.table, store);
		if (typeof callback === FUNCTION) {
            async(callback, id);
        }
	}

});

});
define('shipyard/dom/localStorage', [], function(require, exports, module){
var dom = require('./');

module.exports = dom.window.get('localStorage');

//<node>
if (!module.exports) {
    var store = {};
    module.exports = {
        getItem: function(key) {
            return key in store ? store[key] : null;
        },
        setItem: function(key, value) {
            store[key] = value;
        },
        clear: function() {
            store = {};
        }
    };
}
//</node>

});
define('shipyard/dom/index', [], function(require, exports, module){
var Class = require('../class/Class'),
	Node = require('./Node'),
	Window = require('./Window'),
	Document = require('./Document'),
	Element = require('./Element'),
	Elements = require('./Elements'),
	Slick = require('./Slick'),
	Parser = Slick.Parser,
	Finder = Slick.Finder,
	typeOf = require('../utils/type').typeOf,
    env = require('../env');

//<node>
//TODO: some monkey work to require jsdom when testing from node
var window, document;
if (env.browser.jsdom) {
	var jsdom = require('jsdom');
	window = jsdom.html().createWindow();
	document = window.document;
} else {
	window = this.window;
	document = this.document;
}
//</node>

var hostWindow = new Window(window);
var hostDoc = new Document(document);

var overloadNode = function overloadNode() {
	var el = select(arguments[0]);
	if (el) {
		arguments[0] = el.valueOf();
		return this.parent.apply(this, arguments);
	} else {
		return this;
	}
};

var overloadMethods = ['appendChild', 'inject', 'grab', 'replace'];
var DOMElement = new Class({

	Extends: Element,

	Matches: '*', // so that his comes before the origin Element

	initialize: function DOMElement(node, options) {
		var type = typeOf(node);
		if (type == 'string') node = hostDoc.createElement(node).valueOf();
		this.parent(node, options);
	},

    getElements: function getElements(expression) {
        return collect.apply(this, this.parent(expression));
    }
	
});

overloadMethods.forEach(function(methodName) {
	DOMElement.implement(methodName, overloadNode);
});


// $ and $$



function select(node){
	if (node != null){
		if (typeof node == 'string') return hostDoc.find('#'+node);
		if (node.isNode) return node;
		if (node === window) return hostWindow;
		if (node === document) return hostDoc;
		if (node.toElement) return node.toElement();
		return DOMElement.wrap(node);
	}
	return null;
};


var slice = Array.prototype.slice;
function collect(){
	var list = [];
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i],
			type = typeOf(arg);

		if (type == 'string') list = list.concat(hostDoc.search(arg));
		else if (arg.isNode) list.push(arg);
		else list = list.concat(collect.apply(this, slice.call(arg, 0)));
	}
	return new Elements(list);
};

if (!document.body) throw new Error("document.body doesn't exist yet.");
hostDoc.body = new DOMElement(document.body);
//hostDoc.head = new DOMElement(document.getElementsByTagName('head')[0]);


exports.window = hostWindow;
exports.document = hostDoc;
exports.Element = DOMElement;
exports.Elements = Elements;
exports.$ = exports.select = select;
exports.$$ = exports.collect = collect;

});
define('shipyard/dom/Node', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('../class/Class'),
    Events = require('../class/Events'),
    Store = require('../class/Store'),
    typeOf = require('../utils/type').typeOf,
    object = require('../utils/object'),
    assert = require('../error/assert'),
    DOMEvent = require('./Event'),
    Slick = require('./Slick'),
    Finder = Slick.Finder;

var wrappers = {}, matchers = [];

// Event Listeners

function addEventListener(type, fn, useCapture) {
    this.node.addEventListener(type, fn, !!useCapture);
    return this;
}

function attachEvent(type, fn) {
    this.node.attachEvent('on' + type, fn);
    return this;
}

function removeEventListener(type, fn) {
    this.node.removeEventListener(type, fn, false);
    return this;
}

function detachEvent(type, fn) {
    this.node.detachEvent('on' + type, fn);
    return this;
}

function relay(e){
    var related = e.relatedTarget;
    if (related == null) {
        return true;
    }
    if (!related) {
        return false;
    }
    return (related !== this.getNode() && related.prefix !== 'xul' && !this.contains(related));
}

var CustomEvents = {
    mouseenter: {
        base: 'mouseover',
        condition: relay
    },
    mouseleave: {
        base: 'mouseout',
        condition: relay
    },
	focus: {
		base: 'focus',
		capture: true
	},
	blur: {
		base: 'blur',
		capture: true
	}
};

function wrapHandler(node, type, fn) {
    var realType = type,
        condition = fn,
        orig = fn.listener || fn;
    var events = node.__wrappedEvents || (node.__wrappedEvents = {
        wraps: [],
        origs: []
    });

    var wrapped = events.wraps[events.origs.indexOf(orig)];
    if (!wrapped) {
        var custom = CustomEvents[type];
        if (custom) {
            if (custom.condition) {
                condition = function(e) {
                    if (custom.condition.call(node, e, type)) {
                        return fn.apply(node, arguments);
                    }
                    return true;
                };
            }
            if (custom.base) {
                realType = custom.base;
            }
        }
        wrapped = function(e) {
            if (e) {
                e = new DOMEvent(e, node.getWindow());
            }
            condition.apply(node, arguments);
        };
        wrapped.listener = orig;
        events.origs.push(orig);
        events.wraps.push(wrapped);
    }

    return wrapped;
}

function unwrapHandler(node, type, fn) {
    var events = node.__wrappedEvents || (node.__wrappedEvents = {
        wraps: [],
        origs: []
    });

    var orig = fn.listener || fn;

    var index = events.origs.indexOf(orig);
    var wrapped = events.wraps[index];
    if (wrapped) {
        delete events.wraps[index];
        delete events.origs[index];
        return wrapped;
    }
}

var _addEvent = function() {
    _addEvent = this.node.addEventListener ?
        addEventListener :
        attachEvent;

    _addEvent.apply(this, arguments);
};

var _removeEvent = function() {
    _removeEvent = this.node.removeEventListener ?
        removeEventListener :
        detachEvent;

    _removeEvent.apply(this, arguments);
};

var EventsProtoRemove = Events.prototype.removeListener;
var EventsProtoAdd = Events.prototype.addListener;

var Node = new Class({

    Implements: [Events, Store],

    isNode: true,

    initialize: function Node(node) {
        this.node = node;
        wrappers[Finder.uidOf(node)] = this;
    },
    
    find: function find(expression) {
        return Node.wrap(Finder.find(this.node, expression || '*'));
    },

    getElement: function getElement(expression) {
        return this.find(expression);
    },
    
    search: function search(expression) {
        var nodes = Finder.search(this.node, expression || '*');
        for (var i = 0; i < nodes.length; i++) {
            nodes[i] = Node.wrap(nodes[i]);
        }
        return nodes;
    },

    getElements: function getElements(expression) {
        return this.search(expression);
    },

    getNode: function getNode() {
        return this.node;
    },

    getWindow: function() {
        return Node.wrap(this.node.ownerDocument).getWindow();
    },

    addListener: function addListener(name, fn) {
		var options = CustomEvents[name] || {};
        fn = wrapHandler(this, name, fn);
        _addEvent.call(this, options.base || name, fn, options.capture);
        return EventsProtoAdd.call(this, name, fn);
    },

    removeListener: function removeListener(name, fn) {
        fn = unwrapHandler(this, name, fn);
        _removeEvent.call(this, name, fn);
        return EventsProtoRemove.call(this, name, fn);
    },

    delegate: function delegate(selector, name, fn) {
        var delegation = function(e, target) {
            target = target || (e && e.target);
            var node = this.getNode();
			if (target && target.isNode) {
				target = target.getNode();
			}

            while (target && target !== node) {
                if (Finder.match(target, selector)) {
                    target = Node.wrap(target);
                    return fn.call(target, e, target);
                } else {
                    target = target.parentNode;
                }
            }
        };
		// Not doing this fixes Issue #25.
        //delegation.listener = fn;

        return this.addListener(name, delegation);
    }

});

Node.prototype.valueOf = function(){
    return this.node;
};



Node.defineMutator('Matches', function(match){
    matchers.push({_match: match, _class: this});
});

Node.wrap = function(node) {
    if (node == null) {
        return null;
    }
    if (node.isNode) {
        return node;
    }
	var type = typeOf(node);
	if (type === 'boolean' || type === 'number') {
		return null;
	}
    assert('nodeName' in node, 'Node.wrap requires a DOM node:', node);
    var uid = Finder.uidOf(node), wrapper = wrappers[uid];
    if (wrapper) {
        return wrapper;
    }
    for (var l = matchers.length; l--; l){
        var current = matchers[l];
        if (Finder.match(node, current._match)) {
            return (new current._class(node));
        }
    }

};

module.exports = Node;

});
define('shipyard/class/Store', [], function(require, exports, module){
var Class = require('./Class'),
    string = require('../utils/string');

// make KEY unique so it never conflicts with a user's property.
var KEY = '__store:' + string.uniqueID();

var storage = {};

function storageOf(obj) {
    // Storage gets kept in a separate object away from `obj`, and only
    // referenced by setting the `KEY` property on the object. Using the
    // unique value saved in `KEY`, we look up the storage for this
    // object.
    var uid = obj[KEY] || (obj[KEY] = string.uniqueID());
    return storage[uid] || (storage[uid] = {});
}

module.exports = new Class({

    store: function store(key, value) {
        storageOf(this)[key] = value;
        return this;
    },

    retrieve: function(key, defaultval) {
		var store = storageOf(this);
        return (key in store) ? store[key] : defaultval;
    },

    unstore: function unstore(key) {
        delete storageOf(this)[key];
        return this;
    }

});

});
define('shipyard/utils/string', [], function(require, exports, module){
var typeOf = require('./type').typeOf,

    shipyard = 'shipyard',
	counter = Date.now();

exports.uniqueID = function() {
	return shipyard + '-' + (counter++).toString(36);
};

exports.capitalize = function capitalize(str) {
    str = String(str);
    var first = str.charAt(0);
    return first.toUpperCase() + str.substring(1);
};

exports.camelCase = function camelCase(str) {
    return String(str).replace(/-\D/g, function(match){
        return match.charAt(1).toUpperCase();
    });
};

exports.hyphenate = function hyphenate(str) {
    return String(str).replace(/[A-Z]/g, function(match){
        return ('-' + match.charAt(0).toLowerCase());
    });
};

exports.escapeRegExp = function escapeRegExp(str) {
    return String(str).replace(/([\-\.\*\+?\^\${}()|\[\]\/\\])/g, '\\$1');
};

exports.parseQueryString = function parseQuerystring(str) {
    var object_ = {};
    String(str).split('&').forEach(function(val) {
        var index = val.indexOf('=') + 1,
            value = index ? val.substr(index) : '',
            keys = index ? val.substr(0, index - 1).match(/([^\]\[]+|(\B)(?=\]))/g) : [val],
            obj = object_;

        if (!keys) {
            return;
        }
        value = decodeURIComponent(value);
        keys.forEach(function(key, i){
            key = decodeURIComponent(key);
            var current = obj[key];

            if (i < keys.length - 1) {
                obj = obj[key] = current || {};
            } else if (typeOf(current) === 'array') {
                current.push(value);
            } else {
                obj[key] = current != null ? [current, value] : value;
            }
        });
    });
    return object_;
};

var subRE = /\\?\{([^{}]+)\}/g;
exports.substitute = function substitute(str, obj, regexp) {
	return String(str).replace(regexp || subRE, function(match, name) {
		if (match.charAt(0) === '\\') {
            return match.slice(1);
        }
		if (obj[name] != null) {
			if (typeof obj[name] === 'function') {
                return obj[name]();
            } else {
                return obj[name];
            }
		} else {
			return '';
		}
	});
};

});
define('shipyard/dom/Event', [], function(require, exports, module){
var Class = require('../class/Class'),
    overloadSetter = require('../utils/function').overloadSetter;

var _keys = {};

var Event = module.exports = new Class({

    initialize: function DOMEvent(event, win) {
        event = event || win.event;
        if (event.__extended) {
			return event;
		}
        this.event = event;
        this.__extended = true;
        this.shift = event.shiftKey;
        this.control = event.ctrlKey;
        this.alt = event.altKey;
        this.meta = event.metaKey;
        var type = this.type = event.type;
        var target = event.target || event.srcElement;
        while (target && target.nodeType === 3) {
			target = target.parentNode;
		}

        //TODO: to make .target be an element wrapper
        this.target = target;

        if (type.indexOf('key') === 0) {
            var code = this.code = (event.which || event.keyCode);
            this.key = _keys[code];
            if (type === 'keydown'){
                if (code > 111 && code < 124) {
					this.key = 'f' + (code - 111);
				} else if (code > 95 && code < 106) {
					this.key = code - 96;
				}
            }
            if (this.key == null) {
				this.key = String.fromCharCode(code).toLowerCase();
			}
        } else if (type === 'click' || type === 'dblclick' || type === 'contextmenu' || type === 'DOMMouseScroll' || type.indexOf('mouse') === 0) {
            var doc = win.document;
            doc = (!doc.compatMode || doc.compatMode === 'CSS1Compat') ?
                doc.documentElement : doc.body;
            this.page = {
                x: (event.pageX != null) ? event.pageX : event.clientX + doc.scrollLeft,
                y: (event.pageY != null) ? event.pageY : event.clientY + doc.scrollTop
            };
            this.client = {
                x: (event.pageX != null) ? event.pageX - win.pageXOffset : event.clientX,
                y: (event.pageY != null) ? event.pageY - win.pageYOffset : event.clientY
            };
            if (type === 'DOMMouseScroll' || type === 'mousewheel') {
                this.wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}

            this.rightClick = (event.which === 3 || event.button === 2);
            this.middleClick = (event.which === 2 || event.button === 1);
            if (type === 'mouseover' || type === 'mouseout'){
                var related = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element'];
                while (related && related.nodeType === 3) {
					related = related.parentNode;
				}
                //TODO: make relatedTarget an element wrapper
                this.relatedTarget = related;
            }
        } else if (type.indexOf('touch') === 0 || type.indexOf('gesture') === 0) {
            this.rotation = event.rotation;
            this.scale = event.scale;
            this.targetTouches = event.targetTouches;
            this.changedTouches = event.changedTouches;
            var touches = this.touches = event.touches;
            if (touches && touches[0]){
                var touch = touches[0];
                this.page = {x: touch.pageX, y: touch.pageY};
                this.client = {x: touch.clientX, y: touch.clientY};
            }
        }

        if (!this.client) {
			this.client = {};
		}
        if (!this.page) {
			this.page = {};
		}
    },

    preventDefault: function preventDefault() {
        if (this.event.preventDefault) {
			this.event.preventDefault();
		} else {
			this.event.returnValue = false;
		}
		return this;
    },

    stopPropagation: function stopPropagation() {
        if (this.event.stopPropagation) {
			this.event.stopPropagation();
		} else {
			this.event.cancelBubble = true;
		}
		return this;
    },

    stop: function stop() {
        return this.preventDefault().stopPropagation();
    }

});

Event.defineKey = function(code, key) {
    _keys[code] = key;
    return this;
};

Event.defineKeys = overloadSetter(Event.defineKey);

Event.defineKeys({
    '38': 'up',
    '40': 'down',
    '37': 'left',
    '39': 'right',
    '27': 'esc',
    '32': 'space',
    '8': 'backspace',
    '9': 'tab',
    '46': 'delete',
    '13': 'enter',
	'16': 'shift',
	'17': 'control',
	'18': 'alt',
	'20': 'capslock',
	'33': 'pageup',
	'34': 'pagedown',
	'35': 'end',
	'36': 'home',
	'144': 'numlock',
	'145': 'scrolllock',
	'186': ';',
	'187': '=',
	'188': ',',
	'190': '.',
	'191': '/',
	'192': '`',
	'219': '[',
	'220': '\\',
	'221': ']',
	'222': "'",
	'107': '+'
});

});
define('shipyard/dom/Slick/index', [], function(require, exports, module){
exports.Finder = require('./Finder');
exports.Parser = require('./Parser');
exports.version = '1.1.7';

});
define('shipyard/dom/Slick/Finder', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Parser = require('./Parser');

var local = {},
	featuresCache = {},
	toString = Object.prototype.toString;

// Feature / Bug detection

local.isNativeCode = function(fn){
	return (/\{\s*\[native code\]\s*\}/).test('' + fn);
};

local.isXML = function(document){
	return (!!document.xmlVersion) || (!!document.xml) || (toString.call(document) == '[object XMLDocument]') ||
	(document.nodeType == 9 && document.documentElement.nodeName != 'HTML');
};

local.setDocument = function(document){

	// convert elements / window arguments to document. if document cannot be extrapolated, the function returns.
	var nodeType = document.nodeType;
	if (nodeType == 9); // document
	else if (nodeType) document = document.ownerDocument; // node
	else if (document.navigator) document = document.document; // window
	else return;

	// check if it's the old document

	if (this.document === document) return;
	this.document = document;

	// check if we have done feature detection on this document before

	var root = document.documentElement,
		rootUid = this.getUIDXML(root),
		features = featuresCache[rootUid],
		feature;

	if (features){
		for (feature in features){
			this[feature] = features[feature];
		}
		return;
	}

	features = featuresCache[rootUid] = {};

	features.root = root;
	features.isXMLDocument = this.isXML(document);

	features.brokenStarGEBTN
	= features.starSelectsClosedQSA
	= features.idGetsName
	= features.brokenMixedCaseQSA
	= features.brokenGEBCN
	= features.brokenCheckedQSA
	= features.brokenEmptyAttributeQSA
	= features.isHTMLDocument
	= features.nativeMatchesSelector
	= false;

	var starSelectsClosed, starSelectsComments,
		brokenSecondClassNameGEBCN, cachedGetElementsByClassName,
		brokenFormAttributeGetter;

	var selected, id = 'slick_uniqueid';
	var testNode = document.createElement('div');

	var testRoot = document.body || document.getElementsByTagName('body')[0] || root;
	testRoot.appendChild(testNode);

	// on non-HTML documents innerHTML and getElementsById doesnt work properly
	try {
		testNode.innerHTML = '<a id="'+id+'"></a>';
		features.isHTMLDocument = !!document.getElementById(id);
	} catch(e){};

	if (features.isHTMLDocument){

		testNode.style.display = 'none';

		// IE returns comment nodes for getElementsByTagName('*') for some documents
		testNode.appendChild(document.createComment(''));
		starSelectsComments = (testNode.getElementsByTagName('*').length > 1);

		// IE returns closed nodes (EG:"</foo>") for getElementsByTagName('*') for some documents
		try {
			testNode.innerHTML = 'foo</foo>';
			selected = testNode.getElementsByTagName('*');
			starSelectsClosed = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
		} catch(e){};

		features.brokenStarGEBTN = starSelectsComments || starSelectsClosed;

		// IE returns elements with the name instead of just id for getElementsById for some documents
		try {
			testNode.innerHTML = '<a name="'+ id +'"></a><b id="'+ id +'"></b>';
			features.idGetsName = document.getElementById(id) === testNode.firstChild;
		} catch(e){};

		if (testNode.getElementsByClassName){

			// Safari 3.2 getElementsByClassName caches results
			try {
				testNode.innerHTML = '<a class="f"></a><a class="b"></a>';
				testNode.getElementsByClassName('b').length;
				testNode.firstChild.className = 'b';
				cachedGetElementsByClassName = (testNode.getElementsByClassName('b').length != 2);
			} catch(e){};

			// Opera 9.6 getElementsByClassName doesnt detects the class if its not the first one
			try {
				testNode.innerHTML = '<a class="a"></a><a class="f b a"></a>';
				brokenSecondClassNameGEBCN = (testNode.getElementsByClassName('a').length != 2);
			} catch(e){};

			features.brokenGEBCN = cachedGetElementsByClassName || brokenSecondClassNameGEBCN;
		}

		if (testNode.querySelectorAll){
			// IE 8 returns closed nodes (EG:"</foo>") for querySelectorAll('*') for some documents
			try {
				testNode.innerHTML = 'foo</foo>';
				selected = testNode.querySelectorAll('*');
				features.starSelectsClosedQSA = (selected && !!selected.length && selected[0].nodeName.charAt(0) == '/');
			} catch(e){};

			// Safari 3.2 querySelectorAll doesnt work with mixedcase on quirksmode
			try {
				testNode.innerHTML = '<a class="MiX"></a>';
				features.brokenMixedCaseQSA = !testNode.querySelectorAll('.MiX').length;
			} catch(e){};

			// Webkit and Opera dont return selected options on querySelectorAll
			try {
				testNode.innerHTML = '<select><option selected="selected">a</option></select>';
				features.brokenCheckedQSA = (testNode.querySelectorAll(':checked').length == 0);
			} catch(e){};

			// IE returns incorrect results for attr[*^$]="" selectors on querySelectorAll
			try {
				testNode.innerHTML = '<a class=""></a>';
				features.brokenEmptyAttributeQSA = (testNode.querySelectorAll('[class*=""]').length != 0);
			} catch(e){};

		}

		// IE6-7, if a form has an input of id x, form.getAttribute(x) returns a reference to the input
		try {
			testNode.innerHTML = '<form action="s"><input id="action"/></form>';
			brokenFormAttributeGetter = (testNode.firstChild.getAttribute('action') != 's');
		} catch(e){};

		// native matchesSelector function

		features.nativeMatchesSelector = root.matchesSelector || /*root.msMatchesSelector ||*/ root.mozMatchesSelector || root.webkitMatchesSelector;
		if (features.nativeMatchesSelector) try {
			// if matchesSelector trows errors on incorrect sintaxes we can use it
			features.nativeMatchesSelector.call(root, ':slick');
			features.nativeMatchesSelector = null;
		} catch(e){};

	}

	try {
		root.slick_expando = 1;
		delete root.slick_expando;
		features.getUID = this.getUIDHTML;
	} catch(e) {
		features.getUID = this.getUIDXML;
	}

	testRoot.removeChild(testNode);
	testNode = selected = testRoot = null;

	// getAttribute

	features.getAttribute = (features.isHTMLDocument && brokenFormAttributeGetter) ? function(node, name){
		var method = this.attributeGetters[name];
		if (method) return method.call(node);
		var attributeNode = node.getAttributeNode(name);
		return (attributeNode) ? attributeNode.nodeValue : null;
	} : function(node, name){
		var method = this.attributeGetters[name];
		return (method) ? method.call(node) : node.getAttribute(name);
	};

	// hasAttribute

	features.hasAttribute = (root && this.isNativeCode(root.hasAttribute)) ? function(node, attribute) {
		return node.hasAttribute(attribute);
	} : function(node, attribute) {
		node = node.getAttributeNode(attribute);
		return !!(node && (node.specified || node.nodeValue));
	};

	// contains
	// FIXME: Add specs: local.contains should be different for xml and html documents?
	var nativeRootContains = root && this.isNativeCode(root.contains),
		nativeDocumentContains = document && this.isNativeCode(document.contains);
	features.contains = (nativeRootContains && nativeDocumentContains) ? function(context, node) {
		return context.contains(node);
	} : (nativeRootContains && !nativeDocumentContains) ? function(context, node) {
		// IE8 does not have .contains on document.
		return context === node || ((context === document) ? document.documentElement : context).contains(node);
	} : (root && root.compareDocumentPosition) ? function(context, node){
		return context === node || !!(context.compareDocumentPosition(node) & 16);
	} : function(context, node){
		if (node) do {
			if (node === context) return true;
		} while ((node = node.parentNode));
		return false;
	};

	// document order sorting
	// credits to Sizzle (http://sizzlejs.com/)

	features.documentSorter = (root.compareDocumentPosition) ? function(a, b){
		if (!a.compareDocumentPosition || !b.compareDocumentPosition) return 0;
		return a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
	} : ('sourceIndex' in root) ? function(a, b){
		if (!a.sourceIndex || !b.sourceIndex) return 0;
		return a.sourceIndex - b.sourceIndex;
	} : (document.createRange) ? function(a, b){
		if (!a.ownerDocument || !b.ownerDocument) return 0;
		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		return aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
	} : null ;

	root = null;

	for (feature in features){
		this[feature] = features[feature];
	}
};

// Main Method

var reSimpleSelector = /^([#.]?)((?:[\w-]+|\*))$/,
	reEmptyAttribute = /\[.+[*$^]=(?:""|'')?\]/,
	qsaFailExpCache = {};

local.search = function(context, expression, append, first){

	var found = this.found = (first) ? null : (append || []);

	if (!context) return found;
	else if (context.navigator) context = context.document; // Convert the node from a window to a document
	else if (!context.nodeType) return found;

	// setup

	var parsed, i,
		uniques = this.uniques = {},
		hasOthers = !!(append && append.length),
		contextIsDocument = (context.nodeType == 9);

	if (this.document !== (contextIsDocument ? context : context.ownerDocument)) this.setDocument(context);

	// avoid duplicating items already in the append array
	if (hasOthers) for (i = found.length; i--;) uniques[this.getUID(found[i])] = true;

	// expression checks

	if (typeof expression == 'string'){ // expression is a string

		/*<simple-selectors-override>*/
		var simpleSelector = expression.match(reSimpleSelector);
		simpleSelectors: if (simpleSelector) {

			var symbol = simpleSelector[1],
				name = simpleSelector[2],
				node, nodes;

			if (!symbol){

				if (name == '*' && this.brokenStarGEBTN) break simpleSelectors;
				nodes = context.getElementsByTagName(name);
				if (first) return nodes[0] || null;
				for (i = 0; node = nodes[i++];){
					if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
				}

			} else if (symbol == '#'){

				if (!this.isHTMLDocument || !contextIsDocument) break simpleSelectors;
				node = context.getElementById(name);
				if (!node) return found;
				if (this.idGetsName && node.getAttributeNode('id').nodeValue != name) break simpleSelectors;
				if (first) return node || null;
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);

			} else if (symbol == '.'){

				if (!this.isHTMLDocument || ((!context.getElementsByClassName || this.brokenGEBCN) && context.querySelectorAll)) break simpleSelectors;
				if (context.getElementsByClassName && !this.brokenGEBCN){
					nodes = context.getElementsByClassName(name);
					if (first) return nodes[0] || null;
					for (i = 0; node = nodes[i++];){
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				} else {
					var matchClass = new RegExp('(^|\\s)'+ Parser.escapeRegExp(name) +'(\\s|$)');
					nodes = context.getElementsByTagName('*');
					for (i = 0; node = nodes[i++];){
						className = node.className;
						if (!(className && matchClass.test(className))) continue;
						if (first) return node;
						if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
					}
				}

			}

			if (hasOthers) this.sort(found);
			return (first) ? null : found;

		}
		/*</simple-selectors-override>*/

		/*<query-selector-override>*/
		querySelector: if (context.querySelectorAll) {

			if (!this.isHTMLDocument
				|| qsaFailExpCache[expression]
				//TODO: only skip when expression is actually mixed case
				|| this.brokenMixedCaseQSA
				|| (this.brokenCheckedQSA && expression.indexOf(':checked') > -1)
				|| (this.brokenEmptyAttributeQSA && reEmptyAttribute.test(expression))
				|| (!contextIsDocument //Abort when !contextIsDocument and...
					//  there are multiple expressions in the selector
					//  since we currently only fix non-document rooted QSA for single expression selectors
					&& expression.indexOf(',') > -1
				)
				|| Finder.disableQSA
			) break querySelector;

			var _expression = expression, _context = context;
			if (!contextIsDocument){
				// non-document rooted QSA
				// credits to Andrew Dupont
				var currentId = _context.getAttribute('id'), slickid = 'slickid__';
				_context.setAttribute('id', slickid);
				_expression = '#' + slickid + ' ' + _expression;
				context = _context.parentNode;
			}

			try {
				if (first) return context.querySelector(_expression) || null;
				else nodes = context.querySelectorAll(_expression);
			} catch(e) {
				qsaFailExpCache[expression] = 1;
				break querySelector;
			} finally {
				if (!contextIsDocument){
					if (currentId) _context.setAttribute('id', currentId);
					else _context.removeAttribute('id');
					context = _context;
				}
			}

			if (this.starSelectsClosedQSA) for (i = 0; node = nodes[i++];){
				if (node.nodeName > '@' && !(hasOthers && uniques[this.getUID(node)])) found.push(node);
			} else for (i = 0; node = nodes[i++];){
				if (!(hasOthers && uniques[this.getUID(node)])) found.push(node);
			}

			if (hasOthers) this.sort(found);
			return found;

		}
		/*</query-selector-override>*/

		parsed = Parser.parse(expression);
		if (!parsed.length) return found;
	} else if (expression == null){ // there is no expression
		return found;
	} else if (expression.Slick){ // expression is a parsed Slick object
		parsed = expression;
	} else if (this.contains(context.documentElement || context, expression)){ // expression is a node
		(found) ? found.push(expression) : found = expression;
		return found;
	} else { // other junk
		return found;
	}

	/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

	// cache elements for the nth selectors

	this.posNTH = {};
	this.posNTHLast = {};
	this.posNTHType = {};
	this.posNTHTypeLast = {};

	/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

	// if append is null and there is only a single selector with one expression use pushArray, else use pushUID
	this.push = (!hasOthers && (first || (parsed.length == 1 && parsed.expressions[0].length == 1))) ? this.pushArray : this.pushUID;

	if (found == null) found = [];

	// default engine

	var j, m, n;
	var combinator, tag, id, classList, classes, attributes, pseudos;
	var currentItems, currentExpression, currentBit, lastBit, expressions = parsed.expressions;

	search: for (i = 0; (currentExpression = expressions[i]); i++) for (j = 0; (currentBit = currentExpression[j]); j++){

		combinator = 'combinator:' + currentBit.combinator;
		if (!this[combinator]) continue search;

		tag        = (this.isXMLDocument) ? currentBit.tag : currentBit.tag.toUpperCase();
		id         = currentBit.id;
		classList  = currentBit.classList;
		classes    = currentBit.classes;
		attributes = currentBit.attributes;
		pseudos    = currentBit.pseudos;
		lastBit    = (j === (currentExpression.length - 1));

		this.bitUniques = {};

		if (lastBit){
			this.uniques = uniques;
			this.found = found;
		} else {
			this.uniques = {};
			this.found = [];
		}

		if (j === 0){
			this[combinator](context, tag, id, classes, attributes, pseudos, classList);
			if (first && lastBit && found.length) break search;
		} else {
			if (first && lastBit) for (m = 0, n = currentItems.length; m < n; m++){
				this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
				if (found.length) break search;
			} else for (m = 0, n = currentItems.length; m < n; m++) this[combinator](currentItems[m], tag, id, classes, attributes, pseudos, classList);
		}

		currentItems = this.found;
	}

	// should sort if there are nodes in append and if you pass multiple expressions.
	if (hasOthers || (parsed.expressions.length > 1)) this.sort(found);

	return (first) ? (found[0] || null) : found;
};

// Utils

local.uidx = 1;
local.uidk = 'slick-uniqueid';

local.getUIDXML = function(node){
	var uid = node.getAttribute(this.uidk);
	if (!uid){
		uid = this.uidx++;
		node.setAttribute(this.uidk, uid);
	}
	return uid;
};

local.getUIDHTML = function(node){
	return node.uniqueNumberSY || (node.uniqueNumberSY = this.uidx++);
};

// sort based on the setDocument documentSorter method.

local.sort = function(results){
	if (!this.documentSorter) return results;
	results.sort(this.documentSorter);
	return results;
};

/*<pseudo-selectors>*//*<nth-pseudo-selectors>*/

local.cacheNTH = {};

local.matchNTH = /^([+-]?\d*)?([a-z]+)?([+-]\d+)?$/;

local.parseNTHArgument = function(argument){
	var parsed = argument.match(this.matchNTH);
	if (!parsed) return false;
	var special = parsed[2] || false;
	var a = parsed[1] || 1;
	if (a == '-') a = -1;
	var b = +parsed[3] || 0;
	parsed =
		(special == 'n')	? {a: a, b: b} :
		(special == 'odd')	? {a: 2, b: 1} :
		(special == 'even')	? {a: 2, b: 0} : {a: 0, b: a};

	return (this.cacheNTH[argument] = parsed);
};

local.createNTHPseudo = function(child, sibling, positions, ofType){
	return function(node, argument){
		var uid = this.getUID(node);
		if (!this[positions][uid]){
			var parent = node.parentNode;
			if (!parent) return false;
			var el = parent[child], count = 1;
			if (ofType){
				var nodeName = node.nodeName;
				do {
					if (el.nodeName != nodeName) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			} else {
				do {
					if (el.nodeType != 1) continue;
					this[positions][this.getUID(el)] = count++;
				} while ((el = el[sibling]));
			}
		}
		argument = argument || 'n';
		var parsed = this.cacheNTH[argument] || this.parseNTHArgument(argument);
		if (!parsed) return false;
		var a = parsed.a, b = parsed.b, pos = this[positions][uid];
		if (a == 0) return b == pos;
		if (a > 0){
			if (pos < b) return false;
		} else {
			if (b < pos) return false;
		}
		return ((pos - b) % a) == 0;
	};
};

/*</nth-pseudo-selectors>*//*</pseudo-selectors>*/

local.pushArray = function(node, tag, id, classes, attributes, pseudos){
	if (this.matchSelector(node, tag, id, classes, attributes, pseudos)) this.found.push(node);
};

local.pushUID = function(node, tag, id, classes, attributes, pseudos){
	var uid = this.getUID(node);
	if (!this.uniques[uid] && this.matchSelector(node, tag, id, classes, attributes, pseudos)){
		this.uniques[uid] = true;
		this.found.push(node);
	}
};

local.matchNode = function(node, selector){
	if (this.isHTMLDocument && this.nativeMatchesSelector){
		try {
			return this.nativeMatchesSelector.call(node, selector.replace(/\[([^=]+)=\s*([^'"\]]+?)\s*\]/g, '[$1="$2"]'));
		} catch(matchError) {}
	}

	var parsed = Parser.parse(selector);
	if (!parsed) return true;

	// simple (single) selectors
	var expressions = parsed.expressions, simpleExpCounter = 0, i;
	for (i = 0; (currentExpression = expressions[i]); i++){
		if (currentExpression.length == 1){
			var exp = currentExpression[0];
			if (this.matchSelector(node, (this.isXMLDocument) ? exp.tag : exp.tag.toUpperCase(), exp.id, exp.classes, exp.attributes, exp.pseudos)) return true;
			simpleExpCounter++;
		}
	}

	if (simpleExpCounter == parsed.length) return false;

	var nodes = this.search(this.document, parsed), item;
	for (i = 0; item = nodes[i++];){
		if (item === node) return true;
	}
	return false;
};

local.matchPseudo = function(node, name, argument){
	var pseudoName = 'pseudo:' + name;
	if (this[pseudoName]) return this[pseudoName](node, argument);
	var attribute = this.getAttribute(node, name);
	return (argument) ? argument == attribute : !!attribute;
};

local.matchSelector = function(node, tag, id, classes, attributes, pseudos){
	if (tag){
		var nodeName = (this.isXMLDocument) ? node.nodeName : node.nodeName.toUpperCase();
		if (tag == '*'){
			if (nodeName < '@') return false; // Fix for comment nodes and closed nodes
		} else {
			if (nodeName != tag) return false;
		}
	}

	if (id && node.getAttribute('id') != id) return false;

	var i, part, cls;
	if (classes) for (i = classes.length; i--;){
		cls = this.getAttribute(node, 'class');
		if (!(cls && classes[i].regexp.test(cls))) return false;
	}
	if (attributes) for (i = attributes.length; i--;){
		part = attributes[i];
		if (part.operator ? !part.test(this.getAttribute(node, part.key)) : !this.hasAttribute(node, part.key)) return false;
	}
	if (pseudos) for (i = pseudos.length; i--;){
		part = pseudos[i];
		if (!this.matchPseudo(node, part.key, part.value)) return false;
	}
	return true;
};

var combinators = {

	' ': function(node, tag, id, classes, attributes, pseudos, classList){ // all child nodes, any level

		var i, item, children;

		if (this.isHTMLDocument){
			getById: if (id){
				item = this.document.getElementById(id);
				if ((!item && node.all) || (this.idGetsName && item && item.getAttributeNode('id').nodeValue != id)){
					// all[id] returns all the elements with that name or id inside node
					// if theres just one it will return the element, else it will be a collection
					children = node.all[id];
					if (!children) return;
					if (!children[0]) children = [children];
					for (i = 0; item = children[i++];){
						var idNode = item.getAttributeNode('id');
						if (idNode && idNode.nodeValue == id){
							this.push(item, tag, null, classes, attributes, pseudos);
							break;
						}
					}
					return;
				}
				if (!item){
					// if the context is in the dom we return, else we will try GEBTN, breaking the getById label
					if (this.contains(this.root, node)) return;
					else break getById;
				} else if (this.document !== node && !this.contains(node, item)) return;
				this.push(item, tag, null, classes, attributes, pseudos);
				return;
			}
			getByClass: if (classes && node.getElementsByClassName && !this.brokenGEBCN){
				children = node.getElementsByClassName(classList.join(' '));
				if (!(children && children.length)) break getByClass;
				for (i = 0; item = children[i++];) this.push(item, tag, id, null, attributes, pseudos);
				return;
			}
		}
		getByTag: {
			children = node.getElementsByTagName(tag);
			if (!(children && children.length)) break getByTag;
			if (!this.brokenStarGEBTN) tag = null;
			for (i = 0; item = children[i++];) this.push(item, tag, id, classes, attributes, pseudos);
		}
	},

	'>': function(node, tag, id, classes, attributes, pseudos){ // direct children
		if ((node = node.firstChild)) do {
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
		} while ((node = node.nextSibling));
	},

	'+': function(node, tag, id, classes, attributes, pseudos){ // next sibling
		while ((node = node.nextSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'^': function(node, tag, id, classes, attributes, pseudos){ // first child
		node = node.firstChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'~': function(node, tag, id, classes, attributes, pseudos){ // next siblings
		while ((node = node.nextSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	},

	'++': function(node, tag, id, classes, attributes, pseudos){ // next sibling and previous sibling
		this['combinator:+'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
	},

	'~~': function(node, tag, id, classes, attributes, pseudos){ // next siblings and previous siblings
		this['combinator:~'](node, tag, id, classes, attributes, pseudos);
		this['combinator:!~'](node, tag, id, classes, attributes, pseudos);
	},

	'!': function(node, tag, id, classes, attributes, pseudos){ // all parent nodes up to document
		while ((node = node.parentNode)) if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!>': function(node, tag, id, classes, attributes, pseudos){ // direct parent (one level)
		node = node.parentNode;
		if (node !== this.document) this.push(node, tag, id, classes, attributes, pseudos);
	},

	'!+': function(node, tag, id, classes, attributes, pseudos){ // previous sibling
		while ((node = node.previousSibling)) if (node.nodeType == 1){
			this.push(node, tag, id, classes, attributes, pseudos);
			break;
		}
	},

	'!^': function(node, tag, id, classes, attributes, pseudos){ // last child
		node = node.lastChild;
		if (node){
			if (node.nodeType == 1) this.push(node, tag, id, classes, attributes, pseudos);
			else this['combinator:!+'](node, tag, id, classes, attributes, pseudos);
		}
	},

	'!~': function(node, tag, id, classes, attributes, pseudos){ // previous siblings
		while ((node = node.previousSibling)){
			if (node.nodeType != 1) continue;
			var uid = this.getUID(node);
			if (this.bitUniques[uid]) break;
			this.bitUniques[uid] = true;
			this.push(node, tag, id, classes, attributes, pseudos);
		}
	}

};

for (var c in combinators) local['combinator:' + c] = combinators[c];

var pseudos = {

	/*<pseudo-selectors>*/

	'empty': function(node){
		var child = node.firstChild;
		return !(child && child.nodeType == 1) && !(node.innerText || node.textContent || '').length;
	},

	'not': function(node, expression){
		return !this.matchNode(node, expression);
	},

	'contains': function(node, text){
		return (node.innerText || node.textContent || '').indexOf(text) > -1;
	},

	'first-child': function(node){
		while ((node = node.previousSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'last-child': function(node){
		while ((node = node.nextSibling)) if (node.nodeType == 1) return false;
		return true;
	},

	'only-child': function(node){
		var prev = node;
		while ((prev = prev.previousSibling)) if (prev.nodeType == 1) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeType == 1) return false;
		return true;
	},

	/*<nth-pseudo-selectors>*/

	'nth-child': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTH'),

	'nth-last-child': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHLast'),

	'nth-of-type': local.createNTHPseudo('firstChild', 'nextSibling', 'posNTHType', true),

	'nth-last-of-type': local.createNTHPseudo('lastChild', 'previousSibling', 'posNTHTypeLast', true),

	'index': function(node, index){
		return this['pseudo:nth-child'](node, '' + (index + 1));
	},

	'even': function(node){
		return this['pseudo:nth-child'](node, '2n');
	},

	'odd': function(node){
		return this['pseudo:nth-child'](node, '2n+1');
	},

	/*</nth-pseudo-selectors>*/

	/*<of-type-pseudo-selectors>*/

	'first-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.previousSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'last-of-type': function(node){
		var nodeName = node.nodeName;
		while ((node = node.nextSibling)) if (node.nodeName == nodeName) return false;
		return true;
	},

	'only-of-type': function(node){
		var prev = node, nodeName = node.nodeName;
		while ((prev = prev.previousSibling)) if (prev.nodeName == nodeName) return false;
		var next = node;
		while ((next = next.nextSibling)) if (next.nodeName == nodeName) return false;
		return true;
	},

	/*</of-type-pseudo-selectors>*/

	// custom pseudos

	'enabled': function(node){
		return !node.disabled;
	},

	'disabled': function(node){
		return node.disabled;
	},

	'checked': function(node){
		return node.checked || node.selected;
	},

	'focus': function(node){
		return this.isHTMLDocument && this.document.activeElement === node && (node.href || node.type || this.hasAttribute(node, 'tabindex'));
	},

	'root': function(node){
		return (node === this.root);
	},

	'selected': function(node){
		return node.selected;
	}

	/*</pseudo-selectors>*/
};

for (var p in pseudos) local['pseudo:' + p] = pseudos[p];

// attributes methods

var attributeGetters = local.attributeGetters = {

	'for': function(){
		return ('htmlFor' in this) ? this.htmlFor : this.getAttribute('for');
	},

	'href': function(){
		return ('href' in this) ? this.getAttribute('href', 2) : this.getAttribute('href');
	},

	'style': function(){
		return (this.style) ? this.style.cssText : this.getAttribute('style');
	},

	'tabindex': function(){
		var attributeNode = this.getAttributeNode('tabindex');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	},

	'type': function(){
		return this.getAttribute('type');
	},

	'maxlength': function(){
		var attributeNode = this.getAttributeNode('maxLength');
		return (attributeNode && attributeNode.specified) ? attributeNode.nodeValue : null;
	}

};

attributeGetters.MAXLENGTH = attributeGetters.maxLength = attributeGetters.maxlength;

// Finder

var Finder = local.Finder = {};

// Slick finder

Finder.search = function(context, expression, append){
	return local.search(context, expression, append);
};

Finder.find = function(context, expression){
	return local.search(context, expression, null, true);
};

// Slick containment checker

Finder.contains = function(container, node){
	local.setDocument(container);
	return local.contains(container, node);
};

// Slick attribute getter

Finder.getAttribute = function(node, name){
	local.setDocument(node);
	return local.getAttribute(node, name);
};

Finder.hasAttribute = function(node, name){
	local.setDocument(node);
	return local.hasAttribute(node, name);
};

// Slick matcher

Finder.match = function(node, selector){
	if (!(node && selector)) return false;
	if (!selector || selector === node) return true;
	local.setDocument(node);
	return local.matchNode(node, selector);
};

// Slick attribute accessor

Finder.defineAttributeGetter = function(name, fn){
	local.attributeGetters[name] = fn;
	return this;
};

Finder.lookupAttributeGetter = function(name){
	return local.attributeGetters[name];
};

// Slick pseudo accessor

Finder.definePseudo = function(name, fn){
	local['pseudo:' + name] = function(node, argument){
		return fn.call(node, argument);
	};
	return this;
};

Finder.lookupPseudo = function(name){
	var pseudo = local['pseudo:' + name];
	if (pseudo) return function(argument){
		return pseudo.call(this, argument);
	};
	return null;
};

// Slick overrides accessor

Finder.override = function(regexp, fn){
	local.override(regexp, fn);
	return this;
};

Finder.isXML = local.isXML;

Finder.uidOf = function(node){
	return local.getUIDHTML(node);
};

module.exports = Finder;

});
define('shipyard/dom/Slick/Parser', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net) 
// - MIT Licence
var parsed,
	separatorIndex,
	combinatorIndex,
	reversed,
	cache = {},
	reverseCache = {},
	reUnescape = /\\/g;

var parse = function(expression, isReversed){
	if (expression == null) return null;
	if (expression.Slick === true) return expression;
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {
		Slick: true,
		expressions: [],
		raw: expression,
		reverse: function(){
			return parse(this.raw, true);
		}
	};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[parsed.raw] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}

		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, function(match){
		return '\\' + match;
	});
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|(:+)(<unicode>+)(?:\\((?:(?:([\"'])([^\\13]*)\\13)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
	.replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,

	separator,
	combinator,
	combinatorChildren,

	tagName,
	id,
	className,

	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,

	pseudoMarker,
	pseudoClass,
	pseudoQuote,
	pseudoClassQuotedValue,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}

	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
	}

	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(reUnescape, '');

	} else if (id){
		currentParsed.id = id.replace(reUnescape, '');

	} else if (className){
		className = className.replace(reUnescape, '');

		if (!currentParsed.classList) currentParsed.classList = [];
		if (!currentParsed.classes) currentParsed.classes = [];
		currentParsed.classList.push(className);
		currentParsed.classes.push({
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		});

	} else if (pseudoClass){
		pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
		pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		currentParsed.pseudos.push({
			key: pseudoClass.replace(reUnescape, ''),
			value: pseudoClassValue,
			type: pseudoMarker.length == 1 ? 'class' : 'element'
		});

	} else if (attributeKey){
		attributeKey = attributeKey.replace(reUnescape, '');
		attributeValue = (attributeValue || '').replace(reUnescape, '');

		var test, regexp;

		switch (attributeOperator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attributeValue) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attributeValue) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attributeValue == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attributeValue) > -1;
			}; break;
			case '!=' : test = function(value){
				return attributeValue != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}

		if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function(){
			return false;
		};

		if (!test) test = function(value){
			return value && regexp.test(value);
		};

		if (!currentParsed.attributes) currentParsed.attributes = [];
		currentParsed.attributes.push({
			key: attributeKey,
			operator: attributeOperator,
			value: attributeValue,
			test: test
		});

	}

	return '';
};

exports.parse = parse;
exports.escapeRegExp = escapeRegExp;

});
define('shipyard/dom/Window', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('../class/Class'),
	Node = require('./Node');


var Window = module.exports = new Class({

	Extends: Node,

    getWindow: function() {
        return this.node;
    },

    getDocument: function() {
        return this.node.document;
    },

	toString: function() {
		return '<window>';
	},

	get: function(name) {
		return this.node[name];
	},

    set: function(name, value) {
        this.node[name] = value;
    }

});

});
define('shipyard/dom/Document', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('../class/Class'),
	Node = require('./Node');

var Document = module.exports = new Class({

	Extends: Node,

	getDocument: function() {
		return this.node;
	},

    getWindow: function() {
        return this.node.defaultView;
    },

	createElement: function(tag) {
		return Node.wrap(this.node.createElement(tag));
	},

	toString: function() {
		return '<document>';
	},

    get: function(name) {
        return this.node[name];
    },

    set: function(name, value) {
        this.node[name] = value;
        return this;
    }

});

});
define('shipyard/dom/Element', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('../class/Class'),
    Accessor = require('../utils/Accessor'),
    Color = require('../utils/Color'),
    object = require('../utils/object'),
    string = require('../utils/string'),
    array = require('../utils/array'),
    func = require('../utils/function'),
    typeOf = require('../utils/type').typeOf,
    Node = require('./Node'),
    Slick = require('./Slick'),
    Parser = Slick.Parser,
    Finder = Slick.Finder;


var classRegExps = {};
var classRegExpOf = function(string) {
    return classRegExps[string] ||
        (classRegExps[string] = new RegExp('(^|\\s)' + Parser.escapeRegExp(string) + '(?:\\s|$)'));
};


var Element = new Class({
    
    Extends: Node,

    Matches: '*',

    initialize: function Element(node, options) {
        this.parent(node);
        this.set(options);
    },

    toString: function() {
        return '<' + this.get('tag') + '>';
    },

    getDocument: function getDocument() {
        return this.node.ownerDocument;
    },


    //standard methods
    
    appendChild: function(child) {
        this.node.appendChild(child);
        return this;
    },

    setAttribute: function(name, value) {
        this.node.setAttribute(name, value);
        return this;
    },

    getAttribute: function(name) {
        return this.node.getAttribute(name);
    },

    removeAttribute: function(name) {
        this.node.removeAttribute(name);
        return this;
    },

    contains: function(node) {
        return Finder.contains(this.node, node.getNode ? node.getNode() : node);
    },

    match: function(expression) {
        return Finder.match(this.node, expression);
    },

    
    // className methods
    
    hasClass: function(className) {
        return classRegExpOf(className).test(this.node.className);
    },

    addClass: function(className) {
        var node = this.node;
        if (!this.hasClass(className)) {
            node.className = (node.className + ' ' + className);
        }
        return this;
    },

    removeClass: function(className) {
        var node = this.node;
        node.className = (node.className.replace(classRegExpOf(className), '$1'));
        return this;
    },

    dispose: function dispose() {
        if (this.node.parentNode) {
            this.node.parentNode.removeChild(this.node);
		}
        return this;
    },

    destroy: function destroy() {
        //TODO: this should destroy childNodes, and storage
        this.dispose().empty().removeListeners();
		return null;
    },

    empty: function empty(shouldDestroy) {
        var children = this.node.childNodes;
        for (var i = children.length - 1; i >= 0; i--) {
            this.node.removeChild(children[i]);
        }
        return this;
    },

	clone: function clone(keepContents, keepID) {
		keepContents = keepContents !== false;

		var node = this.node.cloneNode(keepContents);
		var clone_ = Element.wrap(node);

		if (!keepID) {
			var clones = clone_.getElements();
			clones.push(clone_);

			clones.set('id', null);
		}

		return clone_;
	},

    serialize: function serialize() {
        var values = {},
            undefined_;
        this.search("input, select, textarea").forEach(function forEach(el) {
            var type = el.get('type'),
                name = el.get('name');
            if(!name ||
                el.get('disabled') ||
                type==="submit" ||
                type==="reset" ||
                type==="file") {
                return;
            }
            var n = (el.get('tag') === 'select') ?
                el.search('option:selected').map(function(o) { return o.get('value'); }) :
                ((type === 'radio' || type === 'checkbox') && !el.get('checked')) ?
                    null :
                    el.get('value');
            if (typeOf(n) === 'array' && n.length < 2) {
                n = n[0];
            }
            if (!values[name]) {
                values[name] = n;
            } else if (n !=/*=*/ undefined_) {
                values[name] = Array(values[name]);
                values[name].push(n);
            }
        });
        return values;
    
    },

    focus: function() {
        this.node.focus();
    },

    blur: function() {
        this.node.blur();
    },

	reset: function() {
		this.node.reset();
	}

});

// Inserters

var inserters = {

    before: function(context, element) {
        var parent = element.parentNode;
        if (parent) {
            parent.insertBefore(context, element);
        }
    },

    after: function(context, element) {
        var parent = element.parentNode;
        if (parent) {
            parent.insertBefore(context, element.nextSibling);
        }
    },

    bottom: function(context, element) {
        element.appendChild(context);
    },

    top: function(context, element) {
        element.insertBefore(context, element.firstChild);
    }

};

inserters.inside = inserters.bottom;

Element.implement({

    inject: function(element, where) {
        inserters[where || 'bottom'](this.node, element);
        return this;
    },

    eject: function() {
        var parent = this.node.parentNode;
        if (parent) {
            parent.removeChild(this.node);
        }
        return this;
    },

    appendText: function(text, where) {
        var doc = this.node.ownerDocument;
        inserters[where || 'bottom'](doc.createTextNode(text), this.node);
        return this;
    },

    grab: function(element, where) {
        inserters[where || 'bottom'](element, this.node);
        return this;
    },

    replace: function(element) {
        element.parentNode.replaceChild(this.node, element);
        return this;
    },

    wrap: function(element, where) {
        return this.replace(element).grab(element, where);
    }

});

/* Tree Walking */

var methods = {
    find: {
        getNext: '~',
        getPrevious: '!~',
        getFirst: '^',
        getLast: '!^',
        getParent: '!'
    },
    search: {
        getAllNext: '~',
        getAllPrevious: '!~',
        getSiblings: '~~',
        getChildren: '>',
        getParents: '!'
    }
};

object.forEach(methods, function(getters, method) {
    Element.implement(object.map(getters, function(combinator) {
        return function(expression) {
            return this[method](combinator + (expression || '*'));
        };
    }));
});



// Getter / Setter

Accessor.call(Element, 'Getter');
Accessor.call(Element, 'Setter');

var properties = {
    'html': 'innerHTML',
    'class': 'className',
    'for': 'htmlFor'
};

[
    'checked', 'defaultChecked', 'type', 'value', 'accessKey', 'cellPadding',
    'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly',
    'rowSpan', 'tabIndex', 'useMap',
    // Attributes
    'id', 'attributes', 'childNodes', 'className', 'clientHeight',
    'clientLeft', 'clientTop', 'clientWidth', 'dir', 'firstChild',
    'lang', 'lastChild', 'name', 'nextSibling', 'nodeName', 'nodeType',
    'nodeValue', 'offsetHeight', 'offsetLeft', 'offsetParent', 'offsetTop',
    'offsetWidth', 'ownerDocument', 'parentNode', 'prefix', 'previousSibling',
    'innerHTML', 'title'
].forEach(function(property) {
    properties[property] = property;
});


object.forEach(properties, function(real, key) {
    Element.defineSetter(key, function(value) {
        return (this.node[real] = value);
    }).defineGetter(key, function() {
        return this.node[real];
    });
});

var booleans = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked',
    'disabled', 'multiple', 'readonly', 'selected', 'noresize', 'defer'];

booleans.forEach(function(bool) {
    Element.defineSetter(bool, function(value) {
        return (this.node[bool] = !!value);
    }).defineGetter(bool, function() {
        return !!this.node[bool];
    });
});

Element.defineGetters({

    'class': function() {
        var node = this.node;
        return ('className' in node) ? node.className : node.getAttribute('class');
    },

    'for': function() {
        var node = this.node;
        return ('htmlFor' in node) ? node.htmlFor : node.getAttribute('for');
    },

    'href': function() {
        var node = this.node;
        return ('href' in node) ? node.getAttribute('href', 2) : node.getAttribute('href');
    },

    'style': function() {
        var node = this.node;
        return (node.style) ? node.style.cssText : node.getAttribute('style');
    }

}).defineSetters({

    'class': function(value) {
        var node = this.node;
        return ('className' in node) ? node.className = value : node.setAttribute('class', value);
    },

    'for': function(value) {
        var node = this.node;
        return ('htmlFor' in node) ? node.htmlFor = value : node.setAttribute('for', value);
    },

    'style': function(value) {
        var node = this.node;
        return (node.style) ? node.style.cssText = value : node.setAttribute('style', value);
    }

});


var TEXT = 'text';
function textCheck(el) {
     var temp = el.getDocument().createElement('div');
    return (temp.innerText == null) ? 'textContent' : 'innerText';
}

function textAccessors(el) {
    var real = textCheck(el);

    el.constructor.defineSetter(TEXT, function(value) {
        this.node[real] = value;
    }).defineGetter(TEXT, function() {
        return this.node[real];
    });
}

Element.defineSetter(TEXT, function(value) {
    textAccessors(this);
    this.set(TEXT, value);
}).defineGetter(TEXT, function() {
    textAccessors(this);
    return this.get(TEXT);
});

/* get, set */

Element.implement({

    set: func.overloadSetter(function set(name, value) {
        var setter = this.constructor.lookupSetter(name);
        if (setter) {
            setter.call(this, value);
        } else if (value == null) {
            this.node.removeAttribute(name);
        } else {
            this.node.setAttribute(name, value);
        }
        return this;
    }),

    get: func.overloadGetter(function get(name) {
        var getter = this.constructor.lookupGetter(name);
        if (getter) {
            return getter.call(this);
        }
        return this.node.getAttribute(name);
    })

});

Element.defineGetter('node', function() {
    return this.node;
});

Element.defineGetter('tag', function() {
    return this.node.tagName.toLowerCase();
});


// Styles
var StyleMap = {
    left: '@px', top: '@px', bottom: '@px', right: '@px',
    width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
    backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
    fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
    margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
    borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
    zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
};

var ShortStyles = {
    margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}
};

['Top', 'Right', 'Bottom', 'Left'].forEach(function(direction){
    var Short = ShortStyles;
    var All = StyleMap;
    ['margin', 'padding'].forEach(function(style){
        var sd = style + direction;
        Short[style][sd] = All[sd] = '@px';
    });
    var bd = 'border' + direction;
    Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
    var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
    Short[bd] = {};
    Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
    Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
    Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});

var hasOpacity,
    hasFilter,
    reAlpha = /alpha\(opacity=([\d.]+)\)/i;

function checkOpacity(el) {
    var html = el.getDocument().documentElement;
    hasOpacity = html.style.opacity != null;
    hasFilter = html.style.filter != null;
    if (hasOpacity) {
        setOpacity = _setOpacity;
        getOpacity = _getOpacity;
    } else if (hasFilter) {
        setOpacity = _setAlpha;
        getOpacity = _getAlpha;
    } else {
        setOpacity = _storeOpacity;
        getOpacity = _retrieveOpacity;
    }
}

function _setOpacity(el, value) {
    el.node.style.opacity = value;
}

function _getOpacity(el) {
    var opacity = el.node.style.opacity || el.getComputedStyle('opacity');
    return (opacity === '') ? 1 : parseFloat(opacity, 10);
}

function _setAlpha(element, opacity) {
    if (!element.node.currentStyle || !element.node.currentStyle.hasLayout) {
        element.style.zoom = 1;
    }
    opacity = Math.round(Math.max(Math.min(100, (opacity * 100)), 0));
    opacity = (opacity === 100) ? '' : 'alpha(opacity=' + opacity + ')';
    var filter = element.node.style.filter || element.getComputedStyle('filter') || '';
    element.node.style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacity) : filter + opacity;
}

function _getAlpha(element) {
    var filter = (element.node.style.filter || element.getComputedStyle('filter')),
        opacity;
    if (filter) {
        opacity = filter.match(reAlpha);
    }
    return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
}

function _storeOpacity(element, opacity) {
    element.store('opacity', opacity);
}

function _retrieveOpacity(element) {
    return element.retrieve('opacity');
}

var setOpacity = function(el, value) {
    checkOpacity(el);
    setOpacity(el, value);
};

var getOpacity = function(el) {
    checkOpacity(el);
    return getOpacity(el);
};

function getFloatName(node) {
    return (node.cssFloat == null) ? 'styleFloat' : 'cssFloat';
}

function setStyle(property, value) {
    if (property === 'opacity') {
        setOpacity(this, parseFloat(value));
        return this;
    }
    property = (property === 'float' ? getFloatName(this.node) : string.camelCase(property));
    if (typeOf(value) !== 'string') {
        var map = (StyleMap[property] || '@').split(' ');
        value = array.from(value).map(function(val, i){
            if (!map[i]) {
                return '';
            }
            return (typeOf(val) === 'number') ? map[i].replace('@', Math.round(val)) : val;
        }).join(' ');
    } else if (value === String(Number(value))) {
        value = Math.round(value);
    }
    this.node.style[property] = value;
    return this;
}

function getStyle(property) {
    if (property === 'opacity') {
        return getOpacity(this);
    }
    property = (property === 'float' ? getFloatName(this.node) : string.camelCase(property));
    var result = this.node.style[property];
    if (!result) {
        result = [];
        for (var style in Element.ShortStyles){
            if (property !== style) {
                continue;
            }
            for (var s in Element.ShortStyles[style]) {
                result.push(this.getStyle(s));
            }
            return result.join(' ');
        }
        result = this.getComputedStyle(property);
    }
    if (result) {
        result = String(result);
        var color = result.match(/rgba?\([\d\s,]+\)/);
        if (color) {
            result = Color.rgb(result).toHEX();
        }
    }
    return result;
}



Element.implement({
   
    getComputedStyle: function getComputedStyle(property) {
        if (this.node.currentStyle) {
            return this.node.currentStyle[string.camelCase(property)];
        }
        var defaultView = this.node.ownerDocument.defaultView,
            floatName = getFloatName(this.node),
            computed = defaultView ? defaultView.getComputedStyle(this.node, null) : null;
        if (computed) {
            return computed.getPropertyValue((property === floatName) ?
                'float' :
                string.hyphenate(property));
        } else {
            return null;
        }
    },

    getStyle: getStyle,
    
    getStyles: func.overloadGetter(getStyle),

    setStyle: setStyle,

    setStyles: func.overloadSetter(setStyle)

});

Element.defineSetter('styles', function(styles) {
    return this.setStyles(styles);
});

Element.defineSetter('events', function(events) {
    return this.addListeners(events);
});


module.exports = Element;

});
define('shipyard/utils/Color', [], function(require, exports, module){
var Accessor = require('./Accessor'),
    typeOf = require('./type').typeOf;

var limit = function(num, min, max) {
	return Math.min(max, Math.max(min, num));
};

var Color = module.exports = function(color, type) {

	switch(typeOf(color)) {
		case 'string':
			var namedColor = Color.lookupColor(color);
			if (namedColor) {
				color = namedColor;
				type = 'hex';
			} else if (!type) {
				type = (type = color.match(/^rgb|^hsb/)) ? type[0] : 'hex';
			}
		break;
		case 'color': color = [color.red, color.green, color.blue, color.alpha]; type = null; break;
		case 'array': type = type || 'rgb'; color = color.toString(); break;
		case 'number': type = 'hex'; color = color.toString(16); break;
	}

	if (type) {
        color = Color['parse' + type.toUpperCase()](color);
    }
	this[0] = this.red = color[0];
	this[1] = this.green = color[1];
	this[2] = this.blue = color[2];
	this.alpha = color[3];
    this.length = 3;

};

Accessor.call(Color, 'Color');

Color.defineColors({
	maroon: '#800000', red: '#ff0000', orange: '#ffA500', yellow: '#ffff00', olive: '#808000',
	purple: '#800080', fuchsia: "#ff00ff", white: '#ffffff', lime: '#00ff00', green: '#008000',
	navy: '#000080', blue: '#0000ff', aqua: '#00ffff', teal: '#008080',
	black: '#000000', silver: '#c0c0c0', gray: '#808080'
});

var listMatch = /([\-.\d]+)\s*,\s*([\-.\d]+)\s*,\s*([\-.\d]+)\s*,?\s*([\-.\d]*)/,
	hexMatch = /^#?([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{1,2})([a-f0-9]{0,2})$/i;

Color.parseRGB = function(color) {
	return color.match(listMatch).slice(1).map(function(bit, i) {
		return (i < 3) ? Math.round(((bit %= 256) < 0) ? bit + 256 : bit) : limit((bit === '') ? 1 : Number(bit), 0, 1);
	});
};

Color.parseHEX = function(color) {
	if (color.length === 1) {
        color = color + color + color;
    }
	return color.match(hexMatch).slice(1).map(function(bit, i) {
		if (i === 3) {
            return (bit) ? parseInt(bit, 16) / 255 : 1;
        }
		return parseInt((bit.length === 1) ? bit + bit : bit, 16);
	});
};

Color.parseHSB = function(color) {
	var hsb = color.match(listMatch).slice(1).map(function(bit, i) {
		if (i === 0) {
            return Math.round(((bit %= 360) < 0) ? (bit + 360) : bit);
        } else if (i < 3) {
            return limit(Math.round(bit), 0, 100);
        } else {
            return limit((bit === '') ? 1 : Number(bit), 0, 1);
        }
	});

	var a = hsb[3];
	var br = Math.round(hsb[2] / 100 * 255);
	if (hsb[1] === 0) {
        return [br, br, br, a];
    }

	var hue = hsb[0];
	var f = hue % 60;
	var p = Math.round((hsb[2] * (100 - hsb[1])) / 10000 * 255);
	var q = Math.round((hsb[2] * (6000 - hsb[1] * f)) / 600000 * 255);
	var t = Math.round((hsb[2] * (6000 - hsb[1] * (60 - f))) / 600000 * 255);

	switch (Math.floor(hue / 60)) {
		case 0: return [br, t, p, a];
		case 1: return [q, br, p, a];
		case 2: return [p, br, t, a];
		case 3: return [p, q, br, a];
		case 4: return [t, p, br, a];
		default: return [br, p, q, a];
	}
};

var toString = function(type, array) {
	if (array[3] !== 1) {
        type += 'a';
    } else {
        array.pop();
    }
	return type + '(' + array.join(', ') + ')';
};

Color.prototype = {

	toHSB: function(array) {
		var red = this.red, green = this.green, blue = this.blue, alpha = this.alpha;

		var max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
		var hue = 0, saturation = (max !== 0) ? delta / max : 0, brightness = max / 255;
		if (saturation) {
			var rr = (max - red) / delta, gr = (max - green) / delta, br = (max - blue) / delta;
			hue = (red === max) ? br - gr : (green === max) ? 2 + rr - br : 4 + gr - rr;
			if ((hue /= 6) < 0) {
                hue++;
            }
		}

		var hsb = [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100), alpha];

		return (array) ? hsb : toString('hsb', hsb);
	},

	toHEX: function(array) {

		var a = this.alpha;
		var alpha = ((a = Math.round((a * 255)).toString(16)).length === 1) ? a + a : a;

		var hex = [this.red, this.green, this.blue].map(function(bit) {
			bit = bit.toString(16);
			return (bit.length === 1) ? '0' + bit : bit;
		});

		return (array) ? hex.concat(alpha) : '#' + hex.join('') + ((alpha === 'ff') ? '' : alpha);
	},

	toRGB: function(array) {
		var rgb = [this.red, this.green, this.blue, this.alpha];
		return (array) ? rgb : toString('rgb', rgb);
	}

};

Color.prototype.toString = Color.prototype.toRGB;

Color.hex = function(hex) {
	return new Color(hex, 'hex');
};

Color.hsb = function(h, s, b, a) {
	return new Color([h || 0, s || 0, b || 0, (a === null) ? 1 : a], 'hsb');
};

Color.rgb = function(r, g, b, a) {
	return new Color([r || 0, g || 0, b || 0, (a === null) ? 1 : a], 'rgb');
};

});
define('shipyard/utils/array', [], function(require, exports, module){
var typeOf = require('./type').typeOf;

var slice = Array.prototype.slice;

function isArrayLike(item) {
	var type = typeOf(item);
	return item != null && item.length && type !== 'function' && type !== 'string';
}


exports.from = function from(item) {
    var type = typeOf(item);
    if (isArrayLike(item)) {
        if (type === 'array') {
            return item;
        } else {
            return slice.call(item);
        }
    } else {
        return [item];
    }
};

exports.flatten = function flatten(arr) {
	var flatty = [];
	for (var i = 0, len = arr.length; i < len; i++) {
		flatty = flatty.concat(isArrayLike(arr[i]) ? flatten(arr[i]) : arr[i]);
	}
	return flatty;
};

});
define('shipyard/dom/Elements', [], function(require, exports, module){
// Parts copied or inspired by MooTools (http://mootools.net)
// - MIT Licence
var Class = require('../class/Class'),
	Element = require('./Element'),
	object = require('../utils/object'),
    typeOf = require('../utils/type').typeOf,
	overloadSetter = require('../utils/function').overloadSetter;

var slice = Array.prototype.slice;

function Elements() {
	this.uids = {};
	if (arguments.length) {
		this.push.apply(this, arguments);
	}
}

Elements.prototype = object.create(Array.prototype);

Elements.implement = overloadSetter(function implement(key, value) {
	this.prototype[key] = value;
});

Elements.implement({
	
	length: 0,

	push: function push() {
		for (var i = 0, len = arguments.length; i < len; i++) {
            var arg = arguments[i];
            if (typeOf(arg) === 'array' || arg instanceof Elements) {
				this.push.apply(this, slice.call(arg, 0));
			} else {
				this[this.length++] = Element.wrap(arguments[i]);
			}
		}
		return this.length;
	},

    toString: function toString() {
        return String(slice.call(this, 0));
    }

});

// all Element methods should be available on Elements as well
var implementOnElements = function(key, fn) {
	if (!Elements.prototype[key]) {
		Elements.prototype[key] = function(){
			var elements = new Elements(), results = [];
			for (var i = 0; i < this.length; i++){
				var node = this[i], result = node[key].apply(node, arguments);
				if (elements && !(result instanceof Element)) {
					elements = false;
				}
				results[i] = result;
			}

			if (elements){
				elements.push.apply(elements, results);
				return elements;
			}
			
			return results;
		};
	}
};


// suck in all current methods
var dontEnum = {};
['toString', 'initialize', 'appendChild', 'match'].forEach(function(val) { dontEnum[val] = 1; });
for (var k in Element.prototype) {
	var prop = Element.prototype[k];
	if (!dontEnum[k] && !Elements.prototype[k] && (typeof prop === 'function')) {
		implementOnElements(k, Element.prototype[k]);
	}

}

// grab all future methods
var elementImplement = Element.implement;

Element.implement = function(key, fn){
	if (typeof key !== 'string') {
		for (var k in key) {
			this.implement(k, key[k]);
		}
	} else {
		implementOnElements(key, fn);
		elementImplement.call(Element, key, fn);
	}
};


module.exports = Elements;

});
define('shipyard/env/index', [], function(require, exports, module){
/*global process: true, window: true, navigator: true, document:true*/
var isNode = typeof process !== 'undefined',
    isBrowser = typeof window !== 'undefined',
    platform = {},
    browser = {};

if (isNode) {
    //<node>
    platform.name = 'node';
    platform.os = process.platform.toLowerCase().match(/win|mac|linux/gi)[0];
    platform.version = process.versions.node;
    browser.name = 'jsdom';
    browser.version = '0.2';
    //</node>
} else if (isBrowser) {
    var ua = navigator.userAgent.toLowerCase(),
        platform_ = navigator.platform.toLowerCase(),
        UA = ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/) || [null, 'unknown', 0],
        mode = UA[1] === 'ie' && document.documentMode;

    platform.name = ua.match(/ip(?:ad|od|hone)/) ? 'ios' : (ua.match(/(?:webos|android)/) || platform_.match(/mac|win|linux/) || ['other'])[0];
	platform.os = platform.name;

    browser.name = (UA[1] === 'version') ? UA[3] : UA[1];
    browser.vesion = mode || parseFloat((UA[1] === 'opera' && UA[4]) ? UA[4] : UA[2]);
}


browser[browser.name] = true;
browser[browser.name + parseInt(browser.version, 10)] = true;
platform[platform.name] = true;
platform[platform.os] = true;


var env = module.exports = {
    
    platform: platform,

    browser: browser

};


});
define('tasks/views/TaskList', [], function(require, exports, module){
var Class = require('shipyard/class/Class'),
    ListView = require('shipyard/view/ListView'),
    TaskView = require('./TaskView');

module.exports = new Class({

    Extends: ListView,

    itemView: TaskView

});

});
define('shipyard/view/ListView', [], function(require, exports, module){
var Class = require('../class/Class'),
    CollectionView = require('./CollectionView');

module.exports = new Class({
   
    Extends: CollectionView,

	classNames: ['shipyard-list'],

	tag: 'ul',

	empty: 'No items in list.',

    itemViewOptions: {
        tag: 'li'
    }

});

});
define('shipyard/view/CollectionView', [], function(require, exports, module){
var Class = require('../class/Class'),
	object = require('../utils/object'),
    View = require('./View'),
    Container = require('./Container');

var CollectionView = module.exports = new Class({
    
    Extends: Container,

	classNames: ['shipyard-collection'],

    itemView: View,

    itemViewOptions: {
		tag: 'span'
	},

    isEmpty: function isEmpty() {
        return !this.childViews.length;
    },

    addItem: function addItem(item) {
        var ViewKlass = this.get('itemView');
        var options = this.get('itemViewOptions');
        options.content = item;
        var view = new ViewKlass(options);
        delete options.content;
        this.addView(view);
        return this;
    },

    removeItem: function removeItem(item) {
        var view;
        for (var i = 0, len = this.childViews.length; i < len; i++) {
            if (this.childViews[i].get('content') === item) {
                view = this.childViews[i];
                break;
            }
        }

        if (view) {
            this.removeView(view);
        }
        return this;
    },

    getRenderOptions: function getRenderOptions() {
		var opts = this.parent(),
			view = this;
		opts.isEmpty = function isEmpty() { return view.isEmpty(); };
		return opts;
	}

});

CollectionView.defineSetter('itemViewOptions', function(options) {
	object.merge(this.itemViewOptions, options);
});

});
define('shipyard/view/View', [], function(require, exports, module){
var Class = require('../class/Class'),
    Observable = require('../class/Observable'),
    Binding = require('../class/Binding'),
    ViewMediator = require('./ViewMediator'),
    dom = require('../dom'),
	assert = require('../error/assert'),
    overloadSetter = require('../utils/function').overloadSetter,
    object = require('../utils/object'),
	type = require('../utils/type'),
    string = require('../utils/string'),
    log = require('../utils/log');

// ViewMediator translates DOM Events into events that fire on the
// Views, and bubble up parentViews.
var mediator = null;

/**
 *  View
 *
 *  View is a base class that handles rendering data from Models into
 *  HTML, and then emits events that make sense for each view. Views use
 *  a templating system to render themselves, allowing developers to
 *  override and completely customize the HTML of a View. However, the
 *  goal of the Shipyard View system is that most developers will no
 *  longer need to think about HTML at all.
 *
 *  ## Use
 *
 *      var View = require('shipyard/view/View');
 *
 *      var v = new View({
 *          content: 'Hello'
 *      });
 *
 */
var View = module.exports = new Class({

    Extends: Observable,
    
    parentView: null,

    tag: 'span',

	id: null,

	template: require('./templates/base.ejs'),

	content: null,

    _bindings: [],

    initialize: function View(options) {
        this.parent(options);
        this._setupVisibilityBinding();
        this._setupAttributeBindings();
        this._setupContentBinding();
        if (!this.get('id')) {
            this.set('id', string.uniqueID());
        }
        if (!mediator) {
            mediator = new ViewMediator(null, this.constructor.__classNames[0]);
        }
        mediator.registerView(this);
    },

    render: function render() {
        assert(type.isFunction(this.template),
			'View requires a template function to render.');
        this.emit('preRender');
        this.rendered = this.template(this, this.getRenderHelpers());
        delete this.element;
        this.emit('render');
        return this.rendered;
    },

    getRenderHelpers: function getRenderHelpers() {
        var attrs = this._getAttributesMap();
        return {
			escape: function(text) {
				return String(text)
					.replace(/&(?!\w+;)/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;');
			},
            attrs: function() {
                var buffer = [],
                    escape = this.escape;
                for (var attr in attrs) {
                    var val = attrs[attr];
                    if (val) {
                        if (typeof val === 'boolean') {
                            buffer.push(' '+attr+'="'+attr+'"');
                        } else {
                            buffer.push(' '+attr+'="'+escape(val)+'"');
                        }
                    }
                }
                return buffer.join('');
            }
        };
    },

    invalidate: function() {
        if (this.rendered) {
            var oldEl = this.toElement();
            this.render();
            this._createElement().replace(oldEl);
            oldEl.destroy();
        }
        return this;
    },

    // Bind lets us observe an object, update the view's
    // properties, and re-render
    bind: function(observable, map) {
        var binding = new Binding(this, observable, map);
        this._bindings.push(binding);
        object.forEach(map, function(from, to) {
            this.set(to, observable.get(from));
        }, this);
        return this;
    },

    attach: function attach(where) {
        if (this.parentView) {
            throw new Error('Cannot attach Views that have parentViews.');
        }
        
        where = where || dom.document.body;
        dom.$(where).appendChild(this);

        return this;
    },

    detach: function detach() {
        if (this.element) {
            this.element.destroy();
        }
        return this;
    },

    show: function show() {
        this.set('isVisible', true);
    },

    hide: function hide() {
        this.set('isVisible', false);
    },

    isVisible: true,

    _setupVisibilityBinding: function() {
        this.observe('isVisible', function(isVisible) {
            var el = this.get('element');
            if (el) {
                el.setStyle('display', isVisible ? '' : 'none');
            }
        });
    },
    
    _createElement: function _createElement() {
        if (!this.rendered) {
            this.render();
        }
        var temp = new dom.Element('div');
        temp.set('html', this.rendered);
        this.element = temp.getFirst();
        this.emit('elementCreated', this.element);
        return this.element;
    },

    toElement: function toElement() {
        if (!this.get('element')) {
            this._createElement();
        }
        return this.element;
    },

    toString: function toString() {
        return this.rendered || this.render();
        //return '[object View]';
    },

	__classNames: [],

	'class': function(cls) {
		if (arguments.length === 0) {
			// getter
			return this.constructor.__classNames.concat(this.__classNames).join(' ');
		} else {
			// setter
			this.__classNames.push(cls);
		}
	},

	_getAttributes: function _getAttributes() {
		var standardAttrs = ['id', 'class'];
		return standardAttrs.concat(this.constructor.__attributes);
	},

	_getAttributesMap: function _getAttributesMap() {
		var attrMap = {};
		var attrs = this._getAttributes();
		attrs.forEach(function(attr) {
			attrMap[attr] = this.get(attr);
		}, this);
        if (this.get('isVisible') === false) {
            attrMap.style = 'display:none;';
        }
		return attrMap;
	},

    _setupAttributeBindings: function _setupAttributeBindings() {
		var attrs = this._getAttributes();
        attrs.forEach(function observeAttr(attr) {
            this.observe(attr, function(value) {
                var el = this.get('element');
                if (el) {
                    el.set(attr, value);
                }
            });
        }, this);
    },

    _setupContentBinding: function _setupContentBinding() {
        this.observe('content', function() {
            // it would be easy to do element.set('text', content), but
            // with templates we don't know if the content should
            // actually go a couple elements deep.
            if (this.rendered) {
                this.invalidate();
            }
        });
    }

});


View.defineGetter('element', function() {
    if (this.parentView && this.parentView.get('element')) {
        this.element = dom.$(this.parentView).find('#'+ this.get('id'));
    }
    return this.element;
});

// Mutators
View.__attributes = [];
View.defineMutator('attributes', function(attrs) {
	assert(type.isString(attrs) || (attrs.every && attrs.every(type.isString)),
           'View.attributes must a string or Array of strings.');
	this.__attributes = this.__attributes.concat(attrs);
});

View.__classNames = ['shipyard-view'];
View.defineMutator('classNames', function(classes) {
	assert(type.isString(classes) || (classes.every && classes.every(type.isString)),
           'View.classNames must a string or Array of strings.');
	this.__classNames = this.__classNames.concat(classes);
});

});
define('shipyard/class/Binding', [], function(require, exports, module){
var Class = require('./Class'),
    Observable = require('./Observable'),
    object = require('../utils/object'),
    assert = require('../error/assert');

module.exports = new Class({

    _handlers: [],

    isDestroyed: false,

    initialize: function Binding(obs1, obs2, map) {
        // Make sure we have some Observables
        // TODO: This might be a bad idea. What if someone Implements
        // Observable instead of Extending it?
        var msg = 'Cannot bind to non-Observable: ';
        assert(obs1 instanceof Observable, msg, obs1);
        assert(obs2 instanceof Observable, msg, obs2);

        object.forEach(map, function(to2, from1) {
            this._handlers.push(obs2.observe(to2, function(val) {
                obs1.set(from1, val);
            }));

            this._handlers.push(obs1.observe(from1, function(val) {
                obs2.set(to2, val);
            }));
        }, this);

    },

    destroy: function destroy() {
        this._handlers.forEach(function(h) {
            h.detach();
        });
        this._handlers = [];
        this.isDestroyed = true;
    }

});

});
define('shipyard/view/ViewMediator', [], function(require, exports, module){
var Class = require('../class/Class'),
    dom = require('../dom');

var EVENTS = [
    'click',
    'mousedown',
    'mouseup',
    'keydown',
    'keypress',
    'keyup',
    'focus',
    'blur',
    'submit',
    'mouseenter',
    'mouseleave'
];


module.exports = new Class({

    root: null,

    selector: '',

    _views: {},

    initialize: function ViewMediator(root, selector) {
        this.root = dom.$(root) || dom.document.body;
        this.selector = selector;
        this.delegate();
    },

    delegate: function delegate() {
        EVENTS.forEach(function(evt) {
            this.root.delegate('.'+this.selector, evt, this._handleEvent(evt));
        }, this);
    },

    registerView: function registerView(view) {
        this._views[view.get('id')] = view;
    },

    _handleEvent: function(evt) {
        var mediator = this;
        return function viewEvent(ev, element) {
            // View bubbling, stopped with stopPropagation()
            var bubble = true;
            var oldStop = ev.stopPropagation;
            ev.stopPropagation = function() {
                bubble = false;
                oldStop.call(ev);
            };
            var view = mediator._views[element.get('id')];
            while (bubble && view) {
                view.emit(evt, ev);
                view = view.get('parentView');
            }
        };
    }

});

});
define('shipyard/dom/index', [], function(require, exports, module){
var Class = require('../class/Class'),
	Node = require('./Node'),
	Window = require('./Window'),
	Document = require('./Document'),
	Element = require('./Element'),
	Elements = require('./Elements'),
	Slick = require('./Slick'),
	Parser = Slick.Parser,
	Finder = Slick.Finder,
	typeOf = require('../utils/type').typeOf,
    env = require('../env');

//<node>
//TODO: some monkey work to require jsdom when testing from node
var window, document;
if (env.browser.jsdom) {
	var jsdom = require('jsdom');
	window = jsdom.html().createWindow();
	document = window.document;
} else {
	window = this.window;
	document = this.document;
}
//</node>

var hostWindow = new Window(window);
var hostDoc = new Document(document);

var overloadNode = function overloadNode() {
	var el = select(arguments[0]);
	if (el) {
		arguments[0] = el.valueOf();
		return this.parent.apply(this, arguments);
	} else {
		return this;
	}
};

var overloadMethods = ['appendChild', 'inject', 'grab', 'replace'];
var DOMElement = new Class({

	Extends: Element,

	Matches: '*', // so that his comes before the origin Element

	initialize: function DOMElement(node, options) {
		var type = typeOf(node);
		if (type == 'string') node = hostDoc.createElement(node).valueOf();
		this.parent(node, options);
	},

    getElements: function getElements(expression) {
        return collect.apply(this, this.parent(expression));
    }
	
});

overloadMethods.forEach(function(methodName) {
	DOMElement.implement(methodName, overloadNode);
});


// $ and $$



function select(node){
	if (node != null){
		if (typeof node == 'string') return hostDoc.find('#'+node);
		if (node.isNode) return node;
		if (node === window) return hostWindow;
		if (node === document) return hostDoc;
		if (node.toElement) return node.toElement();
		return DOMElement.wrap(node);
	}
	return null;
};


var slice = Array.prototype.slice;
function collect(){
	var list = [];
	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i],
			type = typeOf(arg);

		if (type == 'string') list = list.concat(hostDoc.search(arg));
		else if (arg.isNode) list.push(arg);
		else list = list.concat(collect.apply(this, slice.call(arg, 0)));
	}
	return new Elements(list);
};

if (!document.body) throw new Error("document.body doesn't exist yet.");
hostDoc.body = new DOMElement(document.body);
//hostDoc.head = new DOMElement(document.getElementsByTagName('head')[0]);


exports.window = hostWindow;
exports.document = hostDoc;
exports.Element = DOMElement;
exports.Elements = Elements;
exports.$ = exports.select = select;
exports.$$ = exports.collect = collect;

});
define('shipyard/view/templates/base.ejs', [], function(require, exports, module){
module.exports = function anonymous(__view,__o) {
var p=[],print=function(){p.push.apply(p,arguments);};with(__view){with(__o){p.push('<',get('tag') || '','',attrs() || '','>',escape(get('content') || ''),'</',get('tag') || '','>  ');}}return p.join('');
}
});
define('shipyard/view/Container', [], function(require, exports, module){
var Class = require('../class/Class'),
	View = require('./View'),
	assert = require('../error/assert'),
	object = require('../utils/object');

module.exports = new Class({

	Extends: View,

	childViews: [],

	classNames: ['shipyard-container'],

	tag: 'div',
	
	template: require('./templates/container.ejs'),

	addView: function addView(child) {
		assert(child !== this, 'Cannot add view to itself!');
		assert(child instanceof View,
			'Container.addView requires a View instance argument.');
		
		if (child.parentView) {
			child.parentView.removeView(child);
		}
		
		this.childViews.push(child);
		child.parentView = this;
		this.emit('childAdded', child);
		//child.emit('')

		if (this.rendered) {
			this.invalidate();
		}

		return this;
	},

	removeView: function removeView(child) {
		var index = this.childViews.indexOf(child);
		if (index >= 0) {
			this.childViews.splice(index, 1);
			child.parentView = null;
			this.emit('childRemoved', child);
			//child.emit('?')
		}

        if (this.rendered) {
            this.invalidate();
        }
		return this;
	},

	getRenderHelpers: function getRenderHelpers() {
		var views = this.childViews;
		return object.merge(this.parent(), {
			//views: this.childViews,
			children: function children() {
				return views.map(function(child) {
					return child.render();
				}, this).join('');
			}
		});
	}


});

});
define('shipyard/view/templates/container.ejs', [], function(require, exports, module){
module.exports = function anonymous(__view,__o) {
var p=[],print=function(){p.push.apply(p,arguments);};with(__view){with(__o){p.push('<',get('tag') || '','',attrs() || '','>      ',children() || '','  </',get('tag') || '','>  ');}}return p.join('');
}
});
define('tasks/views/TaskView', [], function(require, exports, module){
var Class = require('shipyard/class/Class'),
    View = require('shipyard/view/View'),
    Container = require('shipyard/view/Container'),
    CheckboxView = require('shipyard/view/CheckboxView');

module.exports = new Class({

    Extends: Container,

    tag: 'li',

    classNames: ['task-view'],

    initialize: function TaskView(options) {
        this.parent(options);

        var checkbox = new CheckboxView({ 'class': 'delete' });
        checkbox.bind(this, { checked: 'isDone' });
        this.addView(checkbox);

        var label = new View({ 'class': 'title' });
        label.bind(this, { content: 'label' });
        this.addView(label);

        this.observe('isDone', this.toggleIsDone);
    },

    toggleIsDone: function(isDone) {
        var element = this.get('element');
        if (element) {
            if (isDone) {
                element.addClass('isDone');
            } else {
                element.removeClass('isDone');
            }
        }
    },

    content: function(task) {
        if (arguments.length === 0) {
            //getter
            return this._task;
        } else {
            //setter
            this._task = task;
        }
    },

    label: View.property(function(label) {
        var content = this.get('content');
        if (!content) {
            return;
        }
        if (arguments.length === 0) {
            // getter
            return this.get('content').get('title');
        } else {
            // setter
            this.get('content').set('title', label);
        }
    }, 'content'),

    isDone: View.property(function(isDone) {
        var content = this.get('content');
        if (!content) {
            return;
        }
        if (arguments.length === 0) {
            // getter
            return content.get('isDone');
        } else {
            // setter
            content.set('isDone', isDone);
        }
    }, 'content'),

	'class': function() {
		var ret = this.parent.apply(this, arguments);
		if (ret && this.get('isDone')) {
			// getter
			return ret + ' isDone';
		}
	}

});

});
define('shipyard/view/View', [], function(require, exports, module){
var Class = require('../class/Class'),
    Observable = require('../class/Observable'),
    Binding = require('../class/Binding'),
    ViewMediator = require('./ViewMediator'),
    dom = require('../dom'),
	assert = require('../error/assert'),
    overloadSetter = require('../utils/function').overloadSetter,
    object = require('../utils/object'),
	type = require('../utils/type'),
    string = require('../utils/string'),
    log = require('../utils/log');

// ViewMediator translates DOM Events into events that fire on the
// Views, and bubble up parentViews.
var mediator = null;

/**
 *  View
 *
 *  View is a base class that handles rendering data from Models into
 *  HTML, and then emits events that make sense for each view. Views use
 *  a templating system to render themselves, allowing developers to
 *  override and completely customize the HTML of a View. However, the
 *  goal of the Shipyard View system is that most developers will no
 *  longer need to think about HTML at all.
 *
 *  ## Use
 *
 *      var View = require('shipyard/view/View');
 *
 *      var v = new View({
 *          content: 'Hello'
 *      });
 *
 */
var View = module.exports = new Class({

    Extends: Observable,
    
    parentView: null,

    tag: 'span',

	id: null,

	template: require('./templates/base.ejs'),

	content: null,

    _bindings: [],

    initialize: function View(options) {
        this.parent(options);
        this._setupVisibilityBinding();
        this._setupAttributeBindings();
        this._setupContentBinding();
        if (!this.get('id')) {
            this.set('id', string.uniqueID());
        }
        if (!mediator) {
            mediator = new ViewMediator(null, this.constructor.__classNames[0]);
        }
        mediator.registerView(this);
    },

    render: function render() {
        assert(type.isFunction(this.template),
			'View requires a template function to render.');
        this.emit('preRender');
        this.rendered = this.template(this, this.getRenderHelpers());
        delete this.element;
        this.emit('render');
        return this.rendered;
    },

    getRenderHelpers: function getRenderHelpers() {
        var attrs = this._getAttributesMap();
        return {
			escape: function(text) {
				return String(text)
					.replace(/&(?!\w+;)/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/"/g, '&quot;');
			},
            attrs: function() {
                var buffer = [],
                    escape = this.escape;
                for (var attr in attrs) {
                    var val = attrs[attr];
                    if (val) {
                        if (typeof val === 'boolean') {
                            buffer.push(' '+attr+'="'+attr+'"');
                        } else {
                            buffer.push(' '+attr+'="'+escape(val)+'"');
                        }
                    }
                }
                return buffer.join('');
            }
        };
    },

    invalidate: function() {
        if (this.rendered) {
            var oldEl = this.toElement();
            this.render();
            this._createElement().replace(oldEl);
            oldEl.destroy();
        }
        return this;
    },

    // Bind lets us observe an object, update the view's
    // properties, and re-render
    bind: function(observable, map) {
        var binding = new Binding(this, observable, map);
        this._bindings.push(binding);
        object.forEach(map, function(from, to) {
            this.set(to, observable.get(from));
        }, this);
        return this;
    },

    attach: function attach(where) {
        if (this.parentView) {
            throw new Error('Cannot attach Views that have parentViews.');
        }
        
        where = where || dom.document.body;
        dom.$(where).appendChild(this);

        return this;
    },

    detach: function detach() {
        if (this.element) {
            this.element.destroy();
        }
        return this;
    },

    show: function show() {
        this.set('isVisible', true);
    },

    hide: function hide() {
        this.set('isVisible', false);
    },

    isVisible: true,

    _setupVisibilityBinding: function() {
        this.observe('isVisible', function(isVisible) {
            var el = this.get('element');
            if (el) {
                el.setStyle('display', isVisible ? '' : 'none');
            }
        });
    },
    
    _createElement: function _createElement() {
        if (!this.rendered) {
            this.render();
        }
        var temp = new dom.Element('div');
        temp.set('html', this.rendered);
        this.element = temp.getFirst();
        this.emit('elementCreated', this.element);
        return this.element;
    },

    toElement: function toElement() {
        if (!this.get('element')) {
            this._createElement();
        }
        return this.element;
    },

    toString: function toString() {
        return this.rendered || this.render();
        //return '[object View]';
    },

	__classNames: [],

	'class': function(cls) {
		if (arguments.length === 0) {
			// getter
			return this.constructor.__classNames.concat(this.__classNames).join(' ');
		} else {
			// setter
			this.__classNames.push(cls);
		}
	},

	_getAttributes: function _getAttributes() {
		var standardAttrs = ['id', 'class'];
		return standardAttrs.concat(this.constructor.__attributes);
	},

	_getAttributesMap: function _getAttributesMap() {
		var attrMap = {};
		var attrs = this._getAttributes();
		attrs.forEach(function(attr) {
			attrMap[attr] = this.get(attr);
		}, this);
        if (this.get('isVisible') === false) {
            attrMap.style = 'display:none;';
        }
		return attrMap;
	},

    _setupAttributeBindings: function _setupAttributeBindings() {
		var attrs = this._getAttributes();
        attrs.forEach(function observeAttr(attr) {
            this.observe(attr, function(value) {
                var el = this.get('element');
                if (el) {
                    el.set(attr, value);
                }
            });
        }, this);
    },

    _setupContentBinding: function _setupContentBinding() {
        this.observe('content', function() {
            // it would be easy to do element.set('text', content), but
            // with templates we don't know if the content should
            // actually go a couple elements deep.
            if (this.rendered) {
                this.invalidate();
            }
        });
    }

});


View.defineGetter('element', function() {
    if (this.parentView && this.parentView.get('element')) {
        this.element = dom.$(this.parentView).find('#'+ this.get('id'));
    }
    return this.element;
});

// Mutators
View.__attributes = [];
View.defineMutator('attributes', function(attrs) {
	assert(type.isString(attrs) || (attrs.every && attrs.every(type.isString)),
           'View.attributes must a string or Array of strings.');
	this.__attributes = this.__attributes.concat(attrs);
});

View.__classNames = ['shipyard-view'];
View.defineMutator('classNames', function(classes) {
	assert(type.isString(classes) || (classes.every && classes.every(type.isString)),
           'View.classNames must a string or Array of strings.');
	this.__classNames = this.__classNames.concat(classes);
});

});
define('shipyard/view/Container', [], function(require, exports, module){
var Class = require('../class/Class'),
	View = require('./View'),
	assert = require('../error/assert'),
	object = require('../utils/object');

module.exports = new Class({

	Extends: View,

	childViews: [],

	classNames: ['shipyard-container'],

	tag: 'div',
	
	template: require('./templates/container.ejs'),

	addView: function addView(child) {
		assert(child !== this, 'Cannot add view to itself!');
		assert(child instanceof View,
			'Container.addView requires a View instance argument.');
		
		if (child.parentView) {
			child.parentView.removeView(child);
		}
		
		this.childViews.push(child);
		child.parentView = this;
		this.emit('childAdded', child);
		//child.emit('')

		if (this.rendered) {
			this.invalidate();
		}

		return this;
	},

	removeView: function removeView(child) {
		var index = this.childViews.indexOf(child);
		if (index >= 0) {
			this.childViews.splice(index, 1);
			child.parentView = null;
			this.emit('childRemoved', child);
			//child.emit('?')
		}

        if (this.rendered) {
            this.invalidate();
        }
		return this;
	},

	getRenderHelpers: function getRenderHelpers() {
		var views = this.childViews;
		return object.merge(this.parent(), {
			//views: this.childViews,
			children: function children() {
				return views.map(function(child) {
					return child.render();
				}, this).join('');
			}
		});
	}


});

});
define('shipyard/view/CheckboxView', [], function(require, exports, module){
var Class = require('../class/Class'),
    View = require('./View');

module.exports = new Class({

    Extends: View,

    template: require('./templates/self-closing.ejs'),

    tag: 'input',

    type: 'checkbox',

    checked: false,

    attributes: ['type', 'value', 'name', 'checked'],

    classNames: ['shipyard-checkbox'],

    onClick: function(ev) {
        this.set('checked', this.get('element').get('checked'));
    }

});

});
define('shipyard/view/templates/self-closing.ejs', [], function(require, exports, module){
module.exports = function anonymous(__view,__o) {
var p=[],print=function(){p.push.apply(p,arguments);};with(__view){with(__o){p.push('<',tag || '','',attrs() || '','/>  ');}}return p.join('');
}
});
define('shipyard/view/FormView', [], function(require, exports, module){
var Class = require('../class/Class'),
	Container = require('./Container');

module.exports = new Class({
	
	Extends: Container,

	classNames: ['shipyard-form'],

	tag: 'form',

    onSubmit: function(ev) {
        ev.preventDefault();
        var el = this.get('element');
        // reset after the event has finished bubbling
        setTimeout(function() {
            el.reset();
        }, 10);
    },

	serialize: function serialize() {
		return this.element.serialize();
	}

});

});
define('shipyard/view/ButtonView', [], function(require, exports, module){
var Class = require('../class/Class'),
	View = require('./View');

module.exports = new Class({
	
	Extends: View,

	classNames: ['shipyard-button'],

	tag: 'button'

});

});
define('shipyard/view/TextFieldView', [], function(require, exports, module){
var Class = require('../class/Class'),
	View = require('./View');

module.exports = new Class({

	Extends: View,

    template: require('./templates/self-closing.ejs'),

	tag: 'input',

	type: 'text',

	classNames: ['shipyard-textfield'],

    attributes: ['type', 'placeholder', 'name', 'value'],

    onBlur: function onBlur() {
        this.set('value', this.get('element').get('value'));
    }

});

});
document.addEventListener("DOMContentLoaded", function() {require("tasks");}, false);
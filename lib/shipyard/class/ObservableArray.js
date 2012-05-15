var Class = require('./Class'),
	Observable = require('./Observable'),
	array = require('../utils/array');

var SLICE = Array.prototype.slice;
var SPLICE = Array.prototype.splice;

/*
 * ObservableArray
 * ==============
 *
 * An instanceof Observable, so property changes will fire
 * propertyChange events, and you can .observe() properties (a specific
 * index, or length?). Perhaps you need to bind to the first element in
 * the array, always. That can be done with `arr.observe('0', fn)`.
 *
 * More likely, you'll want to know when the array as a whole changes.
 * You could just listen for propertyChange event, but then you lose out
 * on anything extra that .observe does, just as deep observing. Plus,
 * it makes people have to use 2 different APIs, which is no fun.
 *
 * arr.observe('array', fn) ?
 *
 * For performance reasons, it'd be good if this property could pass
 * only the values that changed. This way, something like a ListView can
 * know exactly which children need to be re-rendered, instead of
 * re-rendering the whole enchilda...
 *
 */
var ObservableArray = module.exports = new Class({

	Extends: Observable,

	length: 0,

	initialize: function ObservableArray(/* array, or args... */) {
		var arr;
		if (arguments.length > 1) {
			arr = array.from(arguments);
		} else if (arguments.length === 1) {
			arr = array.from(arguments[0]);
		}
		this.parent(arr);
	},

	__set: function __set(key, val) {
		var index = parseInt(key, 10);
		if (!isNaN(index)) {
			this.splice(key, 1, val);
		} else {
			this.parent(key, val);
		}
	},

	toJSON: function toJSON() {
		return SLICE.call(this);
	}

});

// mutators
// push, pop, shift, unshift, splice, reverse, sort

ObservableArray.implement({

	push: function push() {
		var args = [this.get('length'), 0].concat(SLICE.call(arguments));
		this.splice.apply(this, args);
		return this.get('length');
	},

	pop: function pop() {
		if (this.get('length') > 0) {
			var index = this.get('length') - 1;
			var ret = this.splice(index, 1);
			return ret[0];
		}
	},
	
	shift: function shift() {
		if (this.get('length') > 0) {
			var ret = this.splice(0, 1);
			return ret[0];
		}
	},

	unshift: function unshift() {
		var args = [0, 0].concat(SLICE.call(arguments));
		this.splice.apply(this, args);
		return this.get('length');
	},

	sort: function sort(fn) {
		var arr = array.from(this);
		arr.sort(fn);
		this.set(arr);
	},

	reverse: function reverse() {
		var arr = array.from(this);
		arr.reverse();
		this.set(arr);
	},

	splice: function splice(index, howMany /*, args...*/) {
		var oldLength = this.length;
		var oldCopy = SLICE.call(this);
		var adding = SLICE.call(arguments, 2);
		var removed = SPLICE.apply(this, arguments);

		// be sure to trigger the propertyChange events for everything
		this.emit('propertyChange', 'length', this.length);
		var highestLength = Math.max(this.length, oldLength);
		for (var i = 0; i < highestLength; i++) {
			if (oldCopy[i] !== this[i]) {
				this.emit('propertyChange', String(i), this[i], oldCopy[i]);
			}
		}

		this.emit('arrayChange', index, removed, adding);
		this.emit('propertyChange', 'array', index, removed, adding);

		return removed;
	}

});



// accessors
var accessors = ['indexOf', 'lastIndexOf', 'join'];
accessors.forEach(function(method) {
	ObservableArray.implement(method, Array.prototype[method]);
});


// iterators
// if these return a new Array, wrap it in ObservableArray
var iterators = ['forEach', 'some', 'every', 'filter', 'map', 'slice', 'concat'];
iterators.forEach(function(method) {
	ObservableArray.implement(method, function wrappedArrayMethod() {
		var ret = Array.prototype[method].apply(this, arguments);
		if (ret && ret.length) {
			return new ObservableArray(ret);
		} else {
			return ret;
		}
	});
});


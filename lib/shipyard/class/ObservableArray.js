var Class = require('./Class'),
	Observable = require('./Observable'),
	array = require('../utils/array');

var SLICE = Array.prototype.slice;

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
 * TODO:
 * So, there should be a property that you can observe that essentially
 * means "observe the entire freaking thing, batteries included."
 *
 * arr.observe('[]', fn) ?
 * arr.observe('this', fn) ?
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
			this[index] = val;
			if (index + 1 > this.get('length')) {
				this.set('length', index + 1);
			}
		} else {
			this.parent(key, val);
		}
	}

});

// mutators
// push, pop, shift, unshift, splice, reverse, sort

ObservableArray.implement({

	push: function push() {
		array.from(arguments).forEach(function(val) {
			this.set(this.get('length'), val);
		}, this);
		return this.get('length');
	},

	pop: function pop() {
		if (this.get('length') > 0) {
			var index = this.get('length') - 1;
			var ret = this[index];
			this.set(index, undefined);
			this.set('length', index);
			return ret;
		}
	},
	
	shift: function shift() {
		if (this.get('length') > 0) {
			var ret = this[0];
			this.set(SLICE.call(this, 1));
			this.set('length', this.get('length') - 1);
			return ret;
		}
	},

	unshift: function unshift() {
		var args = array.from(arguments);
		args = args.concat(array.from(this));
		this.set(args);
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

	splice: function splice(index, howMany /*. args...*/) {
		throw new Error('Not Implemented');
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
	ObservableArray.implement(method, function() {
		var ret = Array.prototype[method].apply(this, arguments);
		if (ret && ret.length) {
			return new ObservableArray(ret);
		} else {
			return ret;
		}
	});
});


var Class = require('./Class'),
	Store = require('./Store'),
	object = require('../utils/object'),
	assert = require('../error/assert');

var FROM_OBJ = '_fromObj';
var FROM_PROP = '_fromProp';
var TO_OBJ = '_toObj';
var TO_PROP = '_toProp';

var Binding = module.exports = new Class({

	// We use Store because we're holding onto Observables, and if this
	// binding is every (unintentionally?) set as a Class property, and
	// then extended from, we don't want the Observables to be reset(),
	// and watch things blow up.
	Implements: Store,

	_handlers: [],

	_isWatching: false,

	initialize: function Binding(fromObj, fromProp, toObj, toProp) {
		if (fromObj) {
			this.from(fromObj, fromProp);
		}
		if (toObj) {
			this.to(toObj, toProp);
		}
	},

	from: function from(obj, prop) {
		assert(!this._isWatching, 'Binding cannot be changed while watching.');
		assert(obj && obj.observe, 'Binding.from requires an Observable instance.');
		this.store(FROM_OBJ, obj).store(FROM_PROP, prop);
		return this;
	},

	to: function to(obj, prop) {
		assert(!this._isWatching, 'Binding cannot be changed while watching.');
		assert(obj && obj.observe, 'Binding.to requires an Observable instance.');
		this.store(TO_OBJ, obj).store(TO_PROP, prop);
		return this;
	},

	watch: function watch() {
		var fromObj = this.retrieve(FROM_OBJ);
		var toObj = this.retrieve(TO_OBJ);
		var fromProp = this.retrieve(FROM_PROP);
		var toProp = this.retrieve(TO_PROP);

		var deep = false;
		this._isWatching = true;

		this._handlers = [
			fromObj.observe(fromProp, function fromBinding(val) {
				toObj.set(toProp, val);
			}, deep),
			toObj.observe(toProp, function toBinding(val) {
				fromObj.set(fromProp, val);
			}, deep)
		];

		// force an immediate sync also
		toObj.set(toProp, fromObj.get(fromProp));
		return this;
	},

	stopWatching: function stopWatching() {
		this._handlers.forEach(function(h) {
			h.detach();
		});
		this._isWatching = false;
	},

	clone: function clone() {
		var c = new Binding();
		c.store(FROM_OBJ, this.retrieve(FROM_OBJ));
		c.store(TO_OBJ, this.retrieve(TO_OBJ));
		c.store(FROM_PROP, this.retrieve(FROM_PROP));
		c.store(TO_PROP, this.retrieve(TO_PROP));
		return c;
	},

	destroy: function destroy() {
		this.stopWatching();
		this._handlers = [];
		this.unstore(FROM_OBJ).unstore(TO_OBJ)
			.unstore(FROM_PROP).unstore(TO_PROP);
	}

});

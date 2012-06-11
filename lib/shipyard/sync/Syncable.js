var Class = require('../class/Class'),
	Events = require('../class/Events'),
	Observable = require('../class/Observable'),
	ObservableArray = require('../class/ObservableArray'),
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

	pk: 'id',

	initialize: function Syncable(data) {
		// order matters here, since this sets up an Observable.computed
		// that is then processed in this.parent();
		this._setupPKProperty();
		this.parent(data);
	},

	save: function save(options) {
		options = options || {};

		var isNew = this.isNew();

		this.emit('preSave', isNew);

		var onSave = function onSave(data) {
			this.set(data);
			this.emit('save', isNew);
		}.bind(this);


		var sync = getSync(this.constructor, options.using);
		if (isNew) {
			sync.create(this, onSave);
		} else {
			sync.update(this.get('pk'), this, onSave);
		}

		return this;
	},

	isNew: function isNew() {
		return !this.get('pk');
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

		// makes order of args: [eventName, instance, args...]
		var klass = this.constructor;
		var args = [].slice.call(arguments, 1);
		args.unshift(this);
		args.unshift(evt);

		klass.emit.apply(klass, args);
	},

	_setupPKProperty: function _setupPKProperty() {
		var pkField = this.pk;
		this.pk = Observable.computed(pkField);
	},

	// If the `pk` ever changes, we should update the internal __cache,
	// since this used to make sure we only ever have 1 instance of a
	// model with a certain `pk`.
	onPkChange: function pkChangeUpdatesInternalCache(newPK, oldPK) {
		var cache = this.constructor.__cache();
		if (newPK) {
			cache[newPK] = this;
		}
		if (oldPK) {
			delete cache[oldPK];
		}
	}

});


// __cache storage of Syncable instances
var __cache = {};
function cache(klass) {
	var key = klass.__uid;
	return __cache[key]|| (__cache[key] = {});
}
Syncable.__cache = function() {
	return cache(this);
};

// Makes Syncable classes be able to listen to all instance methods
object.extend(Syncable, new Events());
Syncable.parent = Observable; // fix for the merge overwriting parent

// find across syncs
Syncable.find = function find(options) {
	var klass = this;
	var results = new ObservableArray();

	options = options || {};
	function wrap(rows) {
		if (typeOf(rows) !== 'array') {
			rows = [rows];
		}
		var wrapped = rows.map(function(row) { return new klass(row); });
		results.push.apply(results, wrapped);
	}

	var sync = getSync(this, options.using);

	sync.read(options.conditions || {}, function(rows) {
		wrap(rows);
		if (typeof options.callback === 'function') {
			options.callback(results);
		}
	});
	
	return results;
};


// Syncs storage on class
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

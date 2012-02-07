var Class = require('../class/Class'),
	Sync = require('./Sync'),
	dom = require('../dom'),
	string = require('../utils/string'),
	object = require('../utils/object');

var FUNCTION = 'function';
var __store = dom.window.get('localStorage');

function getTable(name) {
	return JSON.parse(__store.getItem(name)) || {};
}

function setTable(name, table) {
	__store.setItem(name, JSON.stringify(table));
}

function async(fn, data) {
    setTimeout(function() {
        fn(data);
    }, 13);
}

module.exports = new Class({

	Extends: Sync,

	create: function create(data, callback) {
		var store = getTable(this.options.table),
			id = string.uniqueID();

		store[id] = data;
		setTable(this.options.table, store);
		if (typeof callback === FUNCTION) {
            async(callback, data);
        }
	},

	update: function update(id, data, callback) {
		var store = getTable(this.options.table);

		store[id] = data;
		setTable(this.options.table, store);
		if (typeof callback === FUNCTION) {
            async(callback, data);
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

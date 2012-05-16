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

        if (data.set) {
			data.set('pk', id);
		} else {
			data.pk = id;
		}

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

var Class = require('shipyard/class/Class'),
	Model = require('shipyard/model/Model'),
	fields = require('shipyard/model/fields'),
	Syncable = require('shipyard/sync/Syncable'),
	BrowserSync = require('shipyard/sync/Browser');

var Task = module.exports = new Class({
	
	Extends: Model,

	Sync: {
		'default': {
			table: 'tasks',
			driver: BrowserSync
		}
	},
	
	fields: {
		id: fields.TextField(),
		title: fields.TextField(),
		createdAt: fields.DateField(),
		isDone: fields.BooleanField({ 'default': false })
	},

	toString: function() {
		return this.get('title');
	}
	
});

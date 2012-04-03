var Class = require('../../class/Class'),
	Store = require('../../class/Store'),
	Field = require('./Field'),
    typeOf = require('../../utils/type').typeOf;

var ForeignKey = new Class({

	Extends: Field,

	Implements: Store,

	options: {
		key: 'pk',
		serialize: 'key'
	},

	initialize: function ForeignKey(model, options) {
		this.parent(options);
		this.store('model', model);
	},

	from: function from(value) {
		// super private omg don't copy this!!!eleven1!!
		var model = this.retrieve('model');
		var cache = model.__cache();
        if (value instanceof model) {
            return value;
        } else if (value in cache) {
			return cache[value];
		} else {
			var data = {};
			if (typeOf(value) === 'object') {
                data = value;
            } else {
                data[this.getOption('key')] = value;
            }
			return new model(data);
		}
	},

	serialize: function serialize(instance) {
		if (!instance) {
			return instance;
		}
		var option = this.getOption('serialize');
		if (option === 'key') {
			return instance.get(this.getOption('key'));
		} else if (option === 'all') {
			return instance.toJSON();
        }
	}

});

module.exports = function(model, options) {
	return new ForeignKey(model, options);
};

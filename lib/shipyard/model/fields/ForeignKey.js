var Class = require('../../class/Class'),
	Field = require('./Field'),
    typeOf = require('../../utils/type').typeOf;

var ForeignKey = new Class({

	Extends: Field,

	options: {
		key: 'pk',
		serialize: 'key'
	},

	initialize: function ForeignKey(model, options) {
		this.parent(options);
		this._model = model;
	},

	from: function from(value) {
		// super private omg don't copy this!!!eleven1!!
		if (value in this._model.__cache) {
			return this._model.__cache[value];
		} else {
			var data = {};
			if (typeOf(value) === 'object') {
                data = value;
            } else {
                data[this.getOption('key')] = value;
            }
			return new this._model(data);
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

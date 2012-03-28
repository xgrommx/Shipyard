var Class = require('../../class/Class'),
    Field = require('./Field'),
    array = require('../../utils/array'),
    typeOf = require('../../utils/type').of;

var ManyField = new Class({

    Extends: Field,

    options: {
        key: 'pk',
        serialize: 'key'
    },

    initialize: function ManyField(model, options) {
        this.parent(options);
        this._model = model;
    },

    from: function from(value) {
        if (!value) {
            return [];
        }

        var values = array.from(value),
            _model = this._model;
        return values.map(function(v) {
            if (v instanceof _model) {
                return v;
            } else if (v in _model.__cache) {
                // super private, dont copy this elsewhere
                return _model.__cache[v];
            } else {
                var data = {};
                if (typeOf(v) === 'object') {
                    data = v;
                } else {
                    data[this.getOption('key')] = v;
                }
                return new _model(data);
            }
        });
    },

    serialize: function serialize(values) {
        if (!values) {
            return values;
        }
        
        values = array.from(values);
        var _model = this._model;
        var option = this.getOption('serialize');
        var key = this.getOption('key');
        return values.map(function(v) {
            if (option === 'key') {
                return v.get(key);
            } else if (option === 'all') {
                return v.toJSON();
            }
        });
    }

});

module.exports = ManyField;

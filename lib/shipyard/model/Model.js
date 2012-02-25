var Class = require('../class/Class'),
    Syncable = require('../sync/Syncable'),
    ShipyardError = require('../error/Error'),
    overloadSetter = require('../utils/function').overloadSetter,
    object = require('../utils/object');

var PK = 'pk';
var UNDEF;

var Model = module.exports = new Class({
    
    Extends: Syncable,
    
    //default to always having an ID field?
    //fields: {},

    pk: 'id',

    initialize: function Model(data) {
        this.parent(data);
        for (var f in this.constructor.__fields) {
            var field = this.constructor.__fields[f];
            if (!field.isField) {
                continue;
            }


            var def = field.getOption('default');
            if (this.get(f) === UNDEF && def != null) {
                this.set(f, def);
            }
        }
    },
    
    _set: function _set(key, value) {
        if (key === PK) {
            key = this.pk;
        }
        if (key in this.constructor.__fields && this.constructor.__fields[key].isField) {
            this.parent(key, this.constructor.__fields[key].from(value));
        } else if (key in this) {
            this.parent(key, value);
        }
    },
    
    _get: function _get(key) {
        if (key === PK) {
            key = this.pk;
        }
        if ((key in this.constructor.__fields) || (key in this)) {
            return this.parent(key);
        }
        throw new ShipyardError('Accessing undefined field "'+key+'"');
    },

    toJSON: function toJSON() {
        var data = {};
        var fields = this.constructor.__fields;
        for (var key in fields) {
            if (fields[key].isField) {
                data[key] = fields[key].serialize(this.get(key));
            }
        }
        return data;
    },

    toString: function toString() {
        // you should override this, since some Views will cast the
        // Model to a string when rendering
        return '[object Model]';
    }

});

Model.__fields = {};

Model.defineMutator('fields', function mutator_fields(fields) {
    object.forEach(fields, function(field, name) {
        this.__fields[name] = field;
    }, this);
});

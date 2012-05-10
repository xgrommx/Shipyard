var Class = require('../../class/Class'),
    Options = require('../../class/Options');


/*
    Field: all properties on a Model are stored via the help of Fields.
    Data is stored with primitive values, but Fields can convert the data
    to useful data formats.
    
    Example: a DateField could accept a Date with it's setter, converting it
    into a string format that can be saved in a data store. The getter can
    convert the string back into a Date object, so the application can use the
    smartest object format.
*/
module.exports = new Class({
    
    Implements: Options,
    
    options: {
        'default': undefined
    },

    isField: true,
    
    initialize: function(opts) {
        this.setOptions(opts);
    },
    
	// Accepts a raw value, and converts it into a JavaScript value that
	// gets stored on the model, and is returned by model.get(field);
	// 
	// This should be a Date object, instead of the date string, for
	// example.
    from: function(value) {
        return value;
    },
    
	// Accepts a JavaScript value, such as a Date object, and returns a
	// value that can be serialized into JSON.
    serialize: function(value) {
        if (typeof value === 'undefined') value = this.options['default'];
        if (value == null) return value;
        return this.from(value);
	}
    
});

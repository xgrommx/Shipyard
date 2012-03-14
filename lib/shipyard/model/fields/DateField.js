var Class = require('../../class/Class'),
	Field = require('./Field'),
    typeOf = require('../../utils/type').typeOf;

var bigDateFormat = /(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?)?/;
var toInt = function(x) { return parseInt(x || 0, 10); };

var DateField = new Class({

	Extends: Field,

    from: function(value) {
        if (value == null) return null;
        if (value instanceof Date) return value;
        
		var type = typeOf(value);
		if (type === 'number') return new Date(value);

		var match;
		if (type === 'string' && (match = value.match(bigDateFormat))) {
			return new Date(Date.UTC(match[1], toInt(match[2]) - 1, toInt(match[3]), toInt(match[4]), toInt(match[5]), toInt(match[6])));
		}

        //throw new ValidationError('Value must be a date');
    }

});

module.exports = function(options) {
	return new DateField(options);
};

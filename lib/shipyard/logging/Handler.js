var Class = require('../class/Class');

var Handler = new Class({

	_level: null,

	_formatter: null,

	initialize: function Handler(level) {
		this._level = level;
	},

	handle: function(level /*, messageArgs...*/) {
		if (level >= this._level) {
			//format, then emit
			
		}
	},

	// sub-classes should override emit, not handle
	emit: function emit(/*args...*/) {

	},

	setFormatter: function setFormatter(formatter) {
	
	},

	setLevel: function setLevel(level) {
	
	}

});

module.exports = Handler;

var Class = require('../class/Class'),
	Container = require('./Container');

module.exports = new Class({
	
	Extends: Container,

	classNames: ['shipyard-form'],

	tag: 'form',

    onSubmit: function(ev) {
        ev.preventDefault();
        var el = this.get('element');
        // reset after the event has finished bubbling
        setTimeout(function() {
            el.reset();
        }, 10);
    },

	serialize: function serialize() {
		return this.element.serialize();
	}

});

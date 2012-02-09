var Class = require('../class/Class'),
	Container = require('./Container');

module.exports = new Class({
	
	Extends: Container,

	tag: 'form',

	events: {
		onElementCreated: function onElementCreated(el) {
			var view = this;
			el.addListener('submit', function onSubmit(e) {
				e.preventDefault();
				view.emit('submit', view.serialize());
				this.reset();
			});
		}
	},

	serialize: function serialize() {
		return this.element.serialize();
	}

});

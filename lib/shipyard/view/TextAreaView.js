var Class = require('shipyard/class/Class'),
	View = require('shipyard/view/View');

module.exports = new Class({
	
	Extends: View,

	tag: 'textarea',

	events: {
		onElementCreated: function() {
			var view = this;
			this.element.addListener('blur', function() {
				view.set('content', this.get('value'));
			});
		}
	}

});

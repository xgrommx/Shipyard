var Class = require('shipyard/class/Class'),
    View = require('shipyard/view/View');

module.exports = new Class({
    
    Extends: View,

    tag: 'textarea',

    classNames: ['shipyard-textarea'],

    onBlur: function() {
        this.set('value', this.get('element').get('value'));
    },

	content: View.computed(function(content) {
		if (arguments.length === 0) {
			return this.get('value');
		} else {
			this.set('value', content);
		}
	}, 'value'),

	_setupContentBinding: function _setupContentBinding() {
		this.observe('value', function(value) {
			var el = this.get('element');
			if (el) {
				el.set('value', value);
			}
		});
	}

});

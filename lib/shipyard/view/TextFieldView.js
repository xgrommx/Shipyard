var Class = require('../class/Class'),
	View = require('./View');

module.exports = new Class({

	Extends: View,

	tag: 'input',

	type: 'text',

    attributes: ['type', 'placeholder', 'name', 'value'],

    events: {
        onElementCreated: function onElementCreated(el) {
            var view = this;
            el.addListener('blur', function onChange(e) {
                view.set('value', el.get('value'));
            });
        }
    }

});

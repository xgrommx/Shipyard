var Class = require('../class/Class'),
	View = require('./View');

module.exports = new Class({

	Extends: View,

	templateName: 'self-closing.ejs',

	tag: 'input',

	type: 'text',

	classNames: ['shipyard-textfield'],

    attributes: ['type', 'placeholder', 'name', 'value'],

    onBlur: function onBlur() {
        this.set('value', this.get('element').get('value'));
    }

});

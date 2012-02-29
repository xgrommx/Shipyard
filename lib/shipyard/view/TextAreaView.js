var Class = require('shipyard/class/Class'),
    View = require('shipyard/view/View');

module.exports = new Class({
    
    Extends: View,

    tag: 'textarea',

    classNames: ['shipyard-textarea'],

    onBlur: function() {
        this.set('value', this.get('element').get('value'));
    }

});

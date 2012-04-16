var Class = require('../class/Class'),
    CollectionView = require('./CollectionView');

module.exports = new Class({

    Extends: CollectionView,

    tag: 'select',

    attributes: [],

    selected: null,

    itemViewOptions: {
        tag: 'option'
    },

    onElementCreated: function selectOnElementCreated() {
        this.emit('change');
    },

    onChange: function selectOnChange() {
        var index = this.get('element').get('selectedIndex');
        this.set('selected', this.childViews[index].get('content'));
    }

});

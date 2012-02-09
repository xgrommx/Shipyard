var Class = require('../class/Class'),
    CollectionView = require('./CollectionView');

module.exports = new Class({
   
    Extends: CollectionView,

	tag: 'ul',

	empty: 'No items in list.',

    itemViewOptions: {
        tag: 'li'
    }

});

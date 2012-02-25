var Class = require('../class/Class'),
    View = require('./View'),
    Container = require('./Container');

module.exports = new Class({
    
    Extends: Container,

	classNames: ['shipyard-collection'],

    itemView: View,

    itemViewOptions: {
		tag: 'span'
	},

    isEmpty: function isEmpty() {
        return !this.childViews.length;
    },

    addItem: function addItem(item) {
        var ViewKlass = this.get('itemView');
        var options = this.get('itemViewOptions');
        options.content = item;
        var view = new ViewKlass(options);
        delete options.content;
        this.addView(view);
        return this;
    },

    removeItem: function removeItem(item) {
        var view;
        for (var i = 0, len = this.childViews.length; i < len; i++) {
            if (this.childViews[i].get('content') === item) {
                view = this.childViews[i];
                break;
            }
        }

        if (view) {
            this.removeView(view);
        }
        return this;
    },

    getRenderOptions: function getRenderOptions() {
		var opts = this.parent(),
			view = this;
		opts.isEmpty = function isEmpty() { return view.isEmpty(); };
		return opts;
	}

});

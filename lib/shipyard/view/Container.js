var Class = require('../class/Class'),
	View = require('./View'),
	assert = require('../error/assert'),
	object = require('../utils/object');

module.exports = new Class({

	Extends: View,

	childViews: [],

	classNames: ['shipyard-container'],

	tag: 'div',
	
	template: require('./templates/container.ejs'),

	addView: function addView(child, index) {
		assert(child !== this, 'Cannot add view to itself!');
		assert(child instanceof View,
			'Container.addView requires a View instance argument.');
		
		if (child.parentView) {
			child.parentView.removeView(child);
		}
		if (typeof index === 'undefined') {
			index = this.childViews.length;
		}
		this.childViews.splice(index, 0, child);
		child.set('parentView', this);
		this.emit('childAdded', child, index);
		//child.emit('')

		if (this.rendered) {
			this.invalidate();
		}

		return this;
	},

	removeView: function removeView(child) {
		var index = this.childViews.indexOf(child);
		if (index >= 0) {
			this.childViews.splice(index, 1);
			child.parentView = null;
			this.emit('childRemoved', child);
			//child.emit('?')
		}

        if (this.rendered) {
            this.invalidate();
        }
		return this;
	},

	getRenderHelpers: function getRenderHelpers() {
		var views = this.childViews;
		return object.merge(this.parent(), {
			//views: this.childViews,
			children: function children() {
				return views.map(function(child) {
					return child.render();
				}, this).join('');
			}
		});
	},

    onElementCreated: function _createElement() {
        this.childViews.forEach(function(child) {
            child.emit('elementCreated');
        });
    }


});

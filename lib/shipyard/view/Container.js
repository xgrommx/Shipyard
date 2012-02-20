var Class = require('../class/Class'),
	View = require('./View'),
	assert = require('../error/assert'),
	object = require('../utils/object');

module.exports = new Class({

	Extends: View,

	childViews: [],

	classNames: ['shipyard-container'],

	tag: 'div',
	
	templateName: 'container.ejs',

	addView: function addView(child) {
		assert(child !== this, 'Cannot add view to itself!');
		assert(child instanceof View,
			'Container.addView requires a View instance argument.');
		
		if (child.parentView) {
			child.parentView.removeView(child);
		}
		
		this.childViews.push(child);
		child.parentView = this;
		this.emit('childAdded', child);
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
	}


});

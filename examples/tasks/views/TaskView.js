var Class = require('shipyard/class/Class'),
	View = require('shipyard/view/View'),
	Container = require('shipyard/view/Container'),
	CheckboxView = require('shipyard/view/CheckboxView'),
	computed = View.computed;

module.exports = new Class({

	Extends: Container,

	tag: 'li',

	classNames: ['task-view'],

	initialize: function TaskView(options) {
		this.parent(options);
		var view = this;

		var checkbox = new CheckboxView({
			'class': 'delete',
			'checked': this.binding('isDone'),
			'onClick': function() {
				view.parentView.emit('taskComplete', view.get('content'));
			}
		});
		this.addView(checkbox);

		var label = new View({
			'class': 'title',
			'content': this.binding('label')
		});
		this.addView(label);

		this.observe('isDone', this.toggleIsDone);
	},

	toggleIsDone: function(isDone) {
		var element = this.get('element');
		if (element) {
			if (isDone) {
				element.addClass('isDone');
			} else {
				element.removeClass('isDone');
			}
		}
	},

	label: computed('content.title'),

	isDone: computed('content.isDone'),

	'class': function() {
		var ret = this.parent.apply(this, arguments);
		if (ret && this.get('isDone')) {
			// getter
			return ret + ' isDone';
		}
	}

});

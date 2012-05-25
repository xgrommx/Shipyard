var Class = require('shipyard/class/Class'),
    View = require('shipyard/view/View'),
    Container = require('shipyard/view/Container'),
    CheckboxView = require('shipyard/view/CheckboxView');

module.exports = new Class({

    Extends: Container,

    tag: 'li',

    classNames: ['task-view'],

    initialize: function TaskView(options) {
        this.parent(options);
        var view = this;

        var checkbox = new CheckboxView({ 'class': 'delete' });
        checkbox.bind(this, { checked: 'isDone' });
        this.addView(checkbox);

        checkbox.addListener('click', function() {
            view.parentView.emit('taskComplete', view.get('content'));
        });

        var label = new View({ 'class': 'title' });
        label.bind(this, { content: 'label' });
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

    content: function(task) {
        if (arguments.length === 0) {
            //getter
            return this._task;
        } else {
            //setter
            this._task = task;
        }
    },

    label: View.property(function(label) {
        var content = this.get('content');
        if (!content) {
            return;
        }
        if (arguments.length === 0) {
            // getter
            return this.get('content').get('title');
        } else {
            // setter
            this.get('content').set('title', label);
        }
    }, 'content'),

    isDone: View.property(function(isDone) {
        var content = this.get('content');
        if (!content) {
            return;
        }
        if (arguments.length === 0) {
            // getter
            return content.get('isDone');
        } else {
            // setter
            content.set('isDone', isDone);
        }
    }, 'content'),

    'class': function() {
        var ret = this.parent.apply(this, arguments);
        if (ret && this.get('isDone')) {
            // getter
            return ret + ' isDone';
        }
    }

});

var Class = require('shipyard/class/Class'),
    Observable = require('shipyard/class/Observable');

var Task = require('../models/Task'),
	ListView = require('../views/TaskList'),
    TaskView = require('../views/TaskView'),
	FormView = require('shipyard/view/FormView'),
	ButtonView = require('shipyard/view/ButtonView'),
	TextFieldView = require('shipyard/view/TextFieldView');

module.exports = new Class({

    Extends: Observable,

    tasks: [],

    initialize: function TasksController(options) {
        this.parent(options);
        this.setupUI();
        this.observeTasks();
    },

    setupUI: function() {
        var form = new FormView()
            .addView(new TextFieldView({ name: 'title', placeholder: 'Task title...' }))
            .addView(new ButtonView({ content: 'Add Task' }))
            .attach();

        form.addListener('submit', function() {
            var task = new Task(this.serialize());
            task.save();
        });

        this.list = new ListView({
            empty: 'Add a task with the above form.',
            itemView: TaskView
        }).attach();

        var clearBtn = new ButtonView({ content: 'Clear Completed Tasks' });
        clearBtn.addListener('click', this._onClear.bind(this));
        clearBtn.attach();
    },

    observeTasks: function() {
        var controller = this;

        Task.find({ callback: function(tasks) {
            tasks.forEach(function(t) {
                controller.addTask(t);
            });
        }});

        Task.addListener('save', function(task, isNew) {
            if (isNew) {
                controller.addTask(task);
            }
        });
        Task.addListener('destroy', function(task) {
            controller.removeTask(task);
        });
                
    },

    addTask: function(task) {
        this.tasks.push(task);
        this.list.addItem(task);
        task.addListener('change', this._onTaskChange);
    },

    removeTask: function(task) {
        var idx = this.tasks.indexOf(task);
        if (idx !== -1) {
            this.tasks.splice(idx, 1);
        }
        this.list.removeItem(task);
        task.removeListener('change', this._onTaskChange);
    },

    _onClear: function() {
        var completed = this.tasks.filter(function(task) {
            return task.get('isDone');
        });
        completed.forEach(function(task) {
            task.destroy();
        }, this);
    },

    _onTaskChange: function(property, value) {
        this.save();
    }

});

var Class = require('shipyard/class/Class'),
	Observable = require('shipyard/class/Observable');

var Task = require('../models/Task'),
	TaskList = require('../views/TaskList'),
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

		this.list = new TaskList({
			content: this.binding('tasks'),
			onTaskComplete: function(task) {
				task.save();
			}
		}).attach();

		var clearBtn = new ButtonView({ content: 'Clear Completed Tasks' });
		clearBtn.addListener('click', this._onClear.bind(this));
		clearBtn.attach();
	},

	observeTasks: function() {
		var controller = this;

		this.set('tasks', Task.find());

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
	},

	removeTask: function(task) {
		var idx = this.tasks.indexOf(task);
		if (idx !== -1) {
			this.tasks.splice(idx, 1);
		}
	},

	_onClear: function() {
		var completed = this.tasks.filter(function(task) {
			return task.get('isDone');
		});
		completed.forEach(function(task) {
			task.destroy();
		}, this);
	}

});

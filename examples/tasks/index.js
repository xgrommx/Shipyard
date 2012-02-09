var Task = require('./models/Task'),
	ListView = require('shipyard/view/ListView'),
	FormView = require('shipyard/view/FormView'),
	ButtonView = require('shipyard/view/ButtonView'),
	TextFieldView = require('shipyard/view/TextFieldView');


var form = new FormView({
	onSubmit: function(data) {
		var task = new Task(data);
		task.save();
	}
})
	.addView(new TextFieldView({ name: 'title', placeholder: 'Task title...' }))
	.addView(new ButtonView({ content: 'Add Task' }))
	.attach();

var list = new ListView({
	empty: 'Add a task with the above form.'
}).attach();

Task.find({ callback: function(tasks) { 
	tasks.forEach(function(t) {
		list.addItem(t);
	});
}});

Task.addListener('save', function(task, isNew) {
	if (isNew) list.addItem(task);
});
Task.addListener('destroy', function(task) {
	list.removeItem(task);
});

var Binding = require('../../../lib/shipyard/class/Binding'),
	Observable = require('../../../lib/shipyard/class/Observable');

module.exports = {
	'Binding': function(it, setup) {
		it('should bind two Observables', function(expect) {
			var model = new Observable(),
				view = new Observable();
			
			var b1 = new Binding(model, 'age', view, 'content');
			var b2 = new Binding().from(model, 'name').to(view, 'id');

			b1.watch();
			b2.watch();

			model.set('name', 'derp');
			expect(view.get('id')).toBe(model.get('name'));

			view.set('content', 3);
			expect(model.get('age')).toBe(view.get('content'));
		});

		it('should bind with paths', function(expect) {
			var model = new Observable(),
				controller = new Observable(),
				view = new Observable();
			model.set('name', 'Sean');
			controller.set('model', model);

			var b1 = new Binding(controller, 'model.name', view, 'content');
			b1.watch();

			expect(view.get('content')).toBe('Sean');

			model.set('name', 'Piotr');
			expect(view.get('content')).toBe('Piotr');
		});

		it('should remove handlers when destroyed', function(expect) {
			var a = new Observable(),
				b = new Observable();
			
			var binding = new Binding(a, 'one',  b, 'two');
			binding.watch();

			binding.destroy();
			expect(binding._handlers.length).toBe(0);

			var spy = this.createSpy();
			a.observe('one', spy);
			b.set('two', 'foo');

			expect(spy).not.toHaveBeenCalled();
		});
	}
};

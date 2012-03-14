var Binding = require('../../../lib/shipyard/class/Binding'),
    Observable = require('../../../lib/shipyard/class/Observable');

module.exports = {
    'Binding': function(it, setup) {
        it('should bind two Observables', function(expect) {
            var model = new Observable(),
                view = new Observable();
            
            var b = new Binding(model, view, { name: 'id', age: 'content' });

            model.set('name', 'derp');
            expect(view.get('id')).toBe(model.get('name'));

            view.set('content', 3);
            expect(model.get('age')).toBe(view.get('content'));
        });

        it('should remove handlers when destroyed', function(expect) {
            var a = new Observable(),
                b = new Observable();
            
            var binding = new Binding(a, b, { one: 'two' });

            binding.destroy();
            expect(binding._handlers.length).toBe(0);
            expect(binding.isDestroyed).toBe(true);

			//TODO: when this test breaks for touching internals,
			//make it just .set() some stuff on `a` and then check `b`.
            expect(a.__events.propertyChange).toBeLike([undefined]);
        });
    }
};

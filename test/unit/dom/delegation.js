var dom = require('../../../lib/shipyard/dom'),
	Spy = require('../../../lib/shipyard/test/Spy');

module.exports = {

	'Element.delegate': function(it, setup) {
		var div, para, ul, li, anchor;

		setup('beforeEach', function() {
			dom.document.body.empty().removeListeners();

			div = new dom.Element('div');
			dom.document.body.appendChild(div);

			para = new dom.Element('p');
			div.appendChild(para);

			ul = new dom.Element('ul');
			dom.document.body.appendChild(ul);

			li = new dom.Element('li');
			ul.appendChild(li);

			anchor = new dom.Element('a');
			li.appendChild(anchor);
		});
		
		it('should trigger handlers for targets that match', function(expect) {
			var fn = new Spy();
			ul.delegate('li a', 'click', fn);

			ul.emit('click');
			expect(fn).not.toHaveBeenCalled();

			ul.emit('click', null, anchor);
			expect(fn).toHaveBeenCalled();
		});

		it('should be removal with the returned Listener', function(expect) {
			var fn = new Spy();
			var listener = ul.delegate('li', 'click', fn);

			listener.detach();
			ul.emit('click', null, li);

			expect(fn).not.toHaveBeenCalled();
		});


		it('should allow the same handler for different selectors', function(expect) {
			var fn = new Spy();
			var body = dom.document.body;

			body.delegate('li', 'click', fn);
			body.delegate('div', 'click', fn);

			body.emit('click', null, li);
			body.emit('click', null, div);

			expect(fn.getCallCount()).toBe(2);
		});
	}

};

var dom = require('../../../lib/shipyard/dom'),
	Spy = require('../../../lib/shipyard/test/Spy');

module.exports = {

	'Element.delegate': function(it, setup) {
		var ul, li,	anchor;

		setup('beforeEach', function() {
			dom.document.body.empty();
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
	}

};

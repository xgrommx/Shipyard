var EJS = require('../../lib/shipyard/template/ejs/Template');

module.exports = {
	'Template': function(it, setup) {
	},

	'EJS': function(it, setup) {
		it('should be able to echo data', function(expect) {
			var text = '<p><%= data %></p>';
			var template = new EJS(text);
			template.compile();

			expect(template.render({ data: 'hello'}))
				.toBe('<p>hello</p>');
		});

	}
};


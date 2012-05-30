var Class = require('../../class/Class'),
	Template = require('../Template'),
	assert = require('../../error/assert'),
	logging = require('../../logging');

var log = logging.getLogger('shipyard.template.ejs');

var EJS = module.exports = new Class({

	Extends: Template,

	compile: function compile() {
		assert(this.text, 'Template cannot compile with no text.');
		var head = 'var p=[],print=function(){p.push.apply(p,arguments);};',
			wrapper = ["with(__view){with(__o){p.push(\'", "');}}return p.join('');"];

		var inner = this.text
			.replace(/[\r\t\n]/g, " ")
			.split("<%").join("\t")
			.replace(/((^|%>)[^\t]*)'/g, "$1\r")

			//operators. like <%, <%=, <%-, <%?

			.replace(/\t=(.*?)%>/g, "',escape($1 || ''),'")
			.replace(/\t-(.*?)%>/g, "',$1 || '','")
			.replace(/\t\?(.*?)%>/g, "',(typeof $1 != 'undefined')?escape($1):'','")


			.split("\t").join("');")
			.split("%>").join("p.push('")
			.split("\r").join("\\'");
		
		this.compiled = new Function('__view','__o', head + wrapper.join(inner));
		return this.compiled;
	}

});

//<node>
// For now, we need to define how to load EJS templates as modules.
var env = require('../../env');
require.extensions['.ejs'] = function(module, filename) {
	var content;
	if (env.platform.node) {
		content = require('fs').readFileSync(filename, 'utf8');
	} else {
		content = require._load(filename);
	}
	var template = new EJS(content);
	try {
		module.exports = template.compile();
	} catch (ex) {
		log.error(ex);
		throw new Error('Syntax error in ' + filename);
	}
};
//</node>

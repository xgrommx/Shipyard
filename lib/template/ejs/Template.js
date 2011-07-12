var Class = require('../../class'),
    Template = require('../Template');


//<node>
// For now, we need to define how to load EJS templates as modules.
require.extensions['.ejs'] = function(module, filename) {
	var content = require('fs').readFileSync(filename, 'utf8');
	// ejs template will need to be wrapped in a string and set to
	// module.exports
	content = 'module.exports = ' + JSON.stringify(content.trim());

	module._compile(content, filename);
};
//</node>


module.exports = new Class({

    Extends: Template,

	options: {
		fileExt: '.ejs'
	},

    compile: function() {
        var head = 'var p=[],print=function(){p.push.apply(p,arguments);};',
            wrapper = ["with(obj){p.push(\'", "');}return p.join('');"];
        
        var inner = this.template
            .replace(/[\r\t\n]/g, " ")
            .split("<%").join("\t")
            .replace(/((^|%>)[^\t]*)'/g, "$1\r")
            
            //operators. like <%, <%=, <%?
            
            .replace(/\t=(.*?)%>/g, "',$1,'")
            //.replace(/\t:(.*?)%>/g, "',new Element('div').set('text',$1).get('html'),'")
            .replace(/\t\?(.*?)%>/g, "',(typeof $1 != 'undefined')?$1:'','")
    
            
            .split("\t").join("');")
            .split("%>").join("p.push('")
            .split("\r").join("\\'");
        
        this.compiled = new Function('obj', head + wrapper.join(inner));
    }
});
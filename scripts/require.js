(function(){

var XHR = function(){
	try { return new XMLHttpRequest(); } catch(e){}
	try { return new ActiveXObject('MSXML2.XMLHTTP'); } catch(e){}
	try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e){}
};

var nonce = + new Date();
var load = function(path){
	var result = false;
	var xhr = XHR();
	xhr.open('GET', path + '?d=' + nonce, false);
	xhr.send(null);
	if (xhr.status >= 200 && xhr.status < 300) result = xhr.responseText;
	return result;
};

var compile = function(module, contents) {
	module.exports = {};
	var fn = new Function('exports, require, module, __filename, __dirname', contents)
	require.paths.unshift(module.dirname);
	fn.call(window, module.exports, require, module, module.filename, module.dirname);
	require.paths.shift();
};

var normalize = function(path, base){
	if (path[0] == '/') base = '';
	path = path.split('/').reverse();
	base = base.split('/');
	var last = base.pop();
	if (last && !(/\.[A-Za-z0-9_-]+$/).test(last)) base.push(last);
	var i = path.length;
	while (i--){
		var current = path[i];
		switch (current){
			case '.': break;
			case '..': base.pop(); break;
			default: base.push(current);
		}
	}
	return base.join('/');
};

var dirname = function(filename) {
    var parts = filename.split('/');
    parts.pop(); //bye filename
    return parts.join('/');
};

var extname = function(filename) {
	return '.' + filename.split('.').pop();
};


var MODULES = {};

var tryFile = function(path) {
	if (require._load(path)) return path;
	return false;
};

var tryExtensions = function(path, exts) {
	var filename;
	for (var i = 0; i < exts.length; i++) {
		filename = path + exts[i];
		if (tryFile(filename)) {
			return filename;
		}
	}
	return false;
};

var require = function req(id, path){
	if (path) require.paths.unshift(path);
	var contents = false,
		filename,
		ext,
		base = '',
		paths = (id[0] === '/') ? [''] : require.paths,
		trailingSlash = (id.slice(-1) === '/'),
		module;
	var exts = Object.keys(require.extensions);
	for (var i = 0, y = paths.length; (i < y); i++) {
		base = normalize(id, paths[i]);
		module = MODULES[base];
		if(module)  break;
		
		//1. tryFile
		//2. tryExtensions
		//3. tryExtensions with index
		if (!trailingSlash) {
			filename = tryFile(base);

			if (!filename) {
				filename = tryExtensions(base, exts);
			}
		}

		if (!filename) {
			filename = tryExtensions(normalize('index', base), exts);
		}
		
		if (filename !== false) {
			module = { filename: filename, dirname: dirname(filename) };
			ext = extname(filename) || '.js';
			if (!require.extensions[ext]) ext = '.js'
			require.extensions[ext](module, filename);
            MODULES[base] = module;
			break;
		}
	}
	if (!module) throw new Error('Cannot find module "' + id + '"');
	if (path) require.paths.shift();
	return module.exports;
};

require.extensions = {
	'.js': function(module, filename) {
				require._compile(module, require._load(filename));
	}
};

require._load = load;
require._compile = compile;
require.paths = [window.location.pathname];

window.require = require;

//find script with data-main
window.addEventListener('DOMContentLoaded', function() {
	var scripts = document.getElementsByTagName('script'),
		main;
	for (var i = 0, length = scripts.length; i < length; i++) {
		if (main = scripts[i].getAttribute('data-main')) {
			var maindir = dirname(main);
			if (~require.paths.indexOf(maindir))
				require.paths.unshift(maindir);
			require(main);
			break;
		}
	}

}, false);

})();
/*global __dirname,console*/
var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync,
	EJS = require('../lib/shipyard/template/ejs/Template'),
	pageTemplate = require('../doc/_template/page.ejs'),
	shipyard = require('../'),
	dom = require('../lib/shipyard/dom'),
	string = require('../lib/shipyard/utils/string'),
	marked = require('marked'),
	highlight = require('highlight').Highlight;

var docDir = path.join(__dirname, '../doc');
var DEST = path.join(__dirname, '../out/doc');
var URL_ROOT = '/Shipyard';

function mktree(pathname) {
	var parts = pathname.replace('C:', '').replace(/\\/g, '/').split('/');
	var curr = '/';
	parts.forEach(function(part) {
		curr = path.join(curr, part);
		if (!existsSync(curr)) {
			fs.mkdirSync(curr);
		}
	});
}

function page(filename, dir, nav) {
	var content = fs.readFileSync(path.join(docDir, dir, filename));
	var output = pageTemplate(nav, {
		main: markdown(String(content)),
		title: filename.replace(/\.md$/, '').replace(/[\-_]/g, ' '),
		version: shipyard.version,
		linkify: function(name, folder) {
			var link = name.replace(/\.md$/, '');
			var url = URL_ROOT + '/' + (folder ? folder + '/' : '') + link + '.html';
			text = link.replace(/[\-_]/g, ' ');
			return string.substitute('<a href="{url}" {class}>{text}</a>', {
				url: url,
				text: text,
				'class': filename === name ? 'class="active"' : ''
			});
		}
	});
	var outname = path.join(DEST, dir, filename.replace(/\.md$/, '.html'));
	fs.writeFileSync(outname, output);
}

function buildDir(dir, nav) {
	var names = nav[dir];

	mktree(path.join(DEST, dir));
	names.forEach(function(name) {
		page(name, dir, nav);
	});
}

function getID(element) {
	var anchor = element.getElement('.permalink');
	if (anchor) {
		return anchor.get('id');
	} else {
		var id = element.get('text').replace(/^[^:]+:/, '');
		id = id.trim();
		id = id.replace(/[^a-zA-Z0-9]+/g, '_');
		return id;
	}
}

function markdown(original) {
	var html = marked(original);
	var el = new dom.Element('div');
	el.set('html', html);

	// highlight all <pre> tags
	el.getElements('pre code').forEach(function (pre) {
		pre.set('html', highlight(pre.get('html')));
	});

	// add a link to all headings
	el.getElements('h1').forEach(function(h1) {
		var id = getID(h1);
		
		var anchor = new dom.Element('a', {
				'class': 'permalink',
				'id': id,
				'href': '#'+id,
				'title': "Permalink to '" + h1.get('text') + "'",
				'text': '#'
		});
		h1.appendChild(anchor);
	});
	el.getElements('h2').forEach(function(h2) {
		var h1 = h2.getPrevious('h1');
		var id = getID(h1) + ':' + getID(h2);

		var anchor = new dom.Element('a', {
				'class': 'permalink',
				'id': id,
				'href': '#'+id,
				'title': "Permalink to '" + h2.get('text') + "'",
				'text': '#'
		});
		h2.appendChild(anchor);
	});

	// replace all .md links to .html
	el.getElements('a').forEach(function(a) {
		a.set('href', a.get('href').replace('.md', '.html'));
	});
	
	return el.get('html');
}

function arr_remove(arr, value) {
	var index = arr.indexOf(value);
	if (index !== -1) {
		arr.splice(index, 1);
	}
}

exports.build = function build() {
	var apis = fs.readdirSync(path.join(docDir, 'api'));
	var topics = fs.readdirSync(path.join(docDir, 'topics'));
	// fix the order of topics
	arr_remove(topics, 'tutorial.md');
	arr_remove(topics, 'installation.md');
	topics.unshift('installation.md');
	topics.unshift('tutorial.md');


	var data = { topics: topics, api: apis };

	mktree(DEST);

	// make homepage
	page('index.md', null, data);

	// move assets
	fs.writeFileSync(path.join(DEST, 'style.css'), fs.readFileSync(path.join(docDir, 'style.css')));

	// make topics pages
	buildDir('topics', data);
	
	// make api pages
	buildDir('api', data);

	console.log('Docs built to "out" directory.');
};

if (require.main === module) {
	exports.build();
}

/*global __dirname*/
var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
	exists = fs.exists || path.exists,
	object = require('../lib/shipyard/utils/object'),
	logging = require('../lib/shipyard/logging');

var log = logging.getLogger('shipyard.server');

var HEADERS = { 'Content-Type': 'text/plain' };

var CONTENT_TYPES = {
	'.js': 'text/javascript',
	'.html': 'text/html',
	'.css': 'text/css'
};

function serveFile(res, filename) {
	fs.stat(filename, function(err, stats) {
		if (err) {
			e500(res, filename);
			return;
		}
		if (!stats.isFile()) {
			e404(res, filename);
			return;
		}
		fs.readFile(filename, 'binary', function(err, contents) {
			if (err) {
				e500(res, filename, err);
				return;
			}
			
			var ext = path.extname(filename);

			res.writeHead(200, {
				'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream'
			});
			res.write(contents);
			res.end();

		});
	});
}

function e404(res, filename) {
	log.warn("404 File not found: ", filename);
	res.writeHead(404, HEADERS);
	res.write('404 Not Found\n');
	res.end();
}

function e500(res, filename, err) {
	log.error("500 Error for file ({0}): {1}", filename, err);
	res.writeHead(500, HEADERS);
	res.write(err + '\n');
	res.end();
	return;
}

function shipyardFile(res, uri) {
	var root = path.join(__dirname, '../');
	var syFile = uri.substring(9);
	var filename = path.join(root, syFile);
	exists(filename, function(exists) {
		if (exists) {
			serveFile(res, filename);
		} else {
			e404(res, filename);
		}
	});
}

exports.serve = function(dir, port) {
	var ROOT = dir || path.join(__dirname, '../'),
		PORT = port || 8000;

	var server = http.createServer(function(req, res) {
		var uri = url.parse(req.url).pathname;
		if (!uri || uri[uri.length-1] === '/') {
			uri = path.join(uri, 'index.html');
		}

		var filename = path.join(ROOT, uri);
		exists(filename, function(exists) {
			if (exists) {
				serveFile(res, filename);
			} else if (uri.indexOf('/shipyard') === 0) {
				shipyardFile(res, uri);
			} else {
				e404(res, filename);
			}
		});
	});
	server.listen(PORT);
	log.debug('Server running at http://localhost:{0}', PORT);
};

if (require.main === module) {
	exports.serve();
}

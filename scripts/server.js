/*global __dirname*/
var http = require('http'),
	fs = require('fs'),
	url = require('url'),
	path = require('path'),
    object = require('../lib/shipyard/utils/object'),
	log = require('../lib/shipyard/utils/log');

var HEADERS = { 'Content-Type': 'text/plain' };

function serveFile(res, filename) {
	fs.readFile(filename, 'binary', function(err, file) {
		if (err) {
			log.error("Error for file (%s): %s", filename, err);
			res.writeHead(500, HEADERS);
			res.write(err + '\n');
			res.end();
			return;
		}
		
		res.writeHead(200);
		res.write(file, 'binary');
		res.end();

	});
}

function e404(res, filename) {
	log.warn("File not found: %s", filename);
	res.writeHead(404, HEADERS);
	res.write('404 Not Found\n');
	res.end();
}

function shipyardFile(res, uri) {
	var root = path.join(__dirname, '../');
	var syFile = uri.substring(9);
	var filename = path.join(root, syFile);
	path.exists(filename, function(exists) {
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
        path.exists(filename, function(exists) {
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
    log.debug('Server running at http://localhost:%d', PORT);
};

if (require.main === module) {
    exports.serve();
}

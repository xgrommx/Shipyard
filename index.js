var fs = require('fs'),
    path = require('path'),
    existsSync = fs.existsSync || path.existsSync,
    assert = require('./lib/shipyard/error/assert'),
    ShipyardError = require('./lib/shipyard/error/Error');

function loadPackage(dir) {
    var package = path.join(dir, './package.json');
    assert(existsSync(package), 'Package.json does not exist: ', package);
    try {
        return require(package);
    } catch (ex) {
        throw new ShipyardError('Error parsing '+ package + '\n' + ex);
    }
}

var shipyard = loadPackage(__dirname);
shipyard.loadPackage = loadPackage;
shipyard.filename = __filename;
shipyard.dirname = __dirname;

module.exports = shipyard;

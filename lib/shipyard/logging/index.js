var Logger = new require('./Logger');

var root = new Logger();

// some logical defaults? `shipyard build` strips these defaults...?
//<node>
root.setLevel('debug');
var ConsoleHandler = require('./ConsoleHandler');
var conHan = new ConsoleHandler();
conHan.setLevel('debug');
root.addHandler(conHan);
//</node>

root.getLogger = function(name) {
	return new Logger(name);
};

module.exports = root;

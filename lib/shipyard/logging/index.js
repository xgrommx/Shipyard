var Logger = require('./Logger');

var root = new Logger();

// some logical defaults? `shipyard build` strips these defaults...?
//<node>
root.setLevel(Logger.DEBUG);
var oldHandle = root.handle;
root.handle = function handle() {
	if (this._handlers.length === 0) {
		// basicConfig!
		var ConsoleHandler = require('./ConsoleHandler');
		var conHan = new ConsoleHandler();
		var Formatter = require('./Formatter');
		conHan.setFormatter(new Formatter('{name}: {message}'));
		root.addHandler(conHan);
	}
	oldHandle.apply(this, arguments);
};
//</node>

root.getLogger = function(name) {
	return new Logger(name);
};

module.exports = root;

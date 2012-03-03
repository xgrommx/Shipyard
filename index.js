var shipyard = require('./package.json');
shipyard.filename = __filename;
shipyard.dirname = __dirname;

var DEFAULT_EXTS = [
	'./lib/shipyard/template/ejs/Template'
];

shipyard.registerExts = function registerExts() {
	DEFAULT_EXTS.forEach(function(template) {
		require(template);
	});
};
module.exports = shipyard;

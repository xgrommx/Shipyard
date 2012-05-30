var LEVELS = module.exports = exports = {
	'NOTSET': 0,
	'DEBUG': 10,
	'INFO': 20,
	'WARNING': 30,
	'ERROR': 40,
	'CRITICAL': 50
};

var NUMBERS = {};
for (var name in LEVELS) {
	NUMBERS[LEVELS[name]] = name;
}

LEVELS.getLevelName = function getLevelName(number) {
	return NUMBERS[number];
};

exports.getLevel = function getLevel(val) {
	var level = parseInt(val, 0);
	if (isNaN(level)) {
		level = LEVELS[String(val).toUpperCase()];
	}
	return level;
};

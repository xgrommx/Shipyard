var string = require('./string');

var DAYS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

var DAYS_ABBR = DAYS.map(function(s) { return s.substring(0, 3); });

var MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

var MONTHS_ABBR = MONTHS.map(function(s) { return s.substring(0, 3); });

function pad(number) {
	if (number < 10) {
		return '0' + String(number);
	} else {
		return number;
	}
}

function dateFormatter(date) {
	return {
		'a': function a() {
			return DAYS_ABBR[date.getDay()];
		},
		'A': function A() {
			return DAYS[date.getDay()];
		},
		'b': function b() {
			return MONTHS_ABBR[date.getMonth()];
		},
		'B': function B() {
			return MONTHS[date.getMonth()];
		},
		'c': function c() {
			return exports.format('{x} {X}', date);
		},
		'd': function d() {
			return pad(date.getDate());
		},
		'e': function e() {
			return date.getDate();
		},
		'H': function H() {
			return pad(date.getHours());
		},
		'I': function I() {
			return pad(date.getHours() % 12 || 12);
		},
		'j': function j() {
			var year = date.getFullYear();
			var month = date.getMonth();
			var diffInSeconds = (Date.UTC(year, month, date.getDate() + 1) -
				Date.UTC(year, 0, 1));
			return Math.floor(diffInSeconds / 86400000);
		},
		'k': function k() {
			return date.getHours();
		},
		'm': function m() {
			return pad(date.getMonth() + 1);
		},
		'M': function M() {
			return pad(date.getMinutes());
		},
		'p': function p() {
			return (date.getHours() >= 12) ? 'PM': 'AM';
		},
		'S': function S() {
			return pad(date.getSeconds());
		},
		'w': function w() {
			return date.getDay();
		},
		'x': function x() {
			return exports.format('{m}/{d}/{y}', date);
		},
		'X': function X() {
			return exports.format('{H}:{M}:{S}', date);
		},
		'y': function y() {
			return String(date.getFullYear()).substr(-2);
		},
		'Y': function Y() {
			return date.getFullYear();
		}
	};
}

exports.format = function format(str, date) {
	date = date || new Date();
	return string.substitute(str, dateFormatter(date));
};

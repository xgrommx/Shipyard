var typeOf = require('./type').typeOf;

var slice = Array.prototype.slice;

function isArrayLike(item) {
	var type = typeOf(item);
	return item != null && ('length' in item) && type !== 'function' && type !== 'string';
}


exports.from = function from(item) {
    var type = typeOf(item);
    if (isArrayLike(item)) {
        if (type === 'array') {
            return item;
        } else {
            return slice.call(item);
        }
    } else {
        return [item];
    }
};

exports.flatten = function flatten(arr) {
	var flatty = [];
	for (var i = 0, len = arr.length; i < len; i++) {
		flatty = flatty.concat(isArrayLike(arr[i]) ? flatten(arr[i]) : arr[i]);
	}
	return flatty;
};

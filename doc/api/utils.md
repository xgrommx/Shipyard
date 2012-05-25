# Module: type

## Method: typeOf

Better version of `typeof`, returns a string of the type of the passed
in value.

### Syntax

	var type = typeOf(value);

### Arguments

- value - (_mixed_) Any value.

### Returns

- _string_ - The type.

## Method: isString

Convenience method equivalent to `typeOf(value) === 'string'`.

## Method: isFunction

Convenience method equivalent to `typeOf(value) === 'function'`.

## Method: isBoolean

Convenience method equivalent to `typeOf(value) === 'boolean'`.

## Method: isNumber

Convenience method equivalent to `typeOf(value) === 'number'`.

## Method: isArray

Convenience method equivalent to `typeOf(value) === 'array'`.

# Module: object

Used via `require('shipyard/utils/object')`.

## Method: extend

Extend an object with another object, copying properties over.

### Syntax

	extend(child, parent);

### Arguments

- child - (_object_) The object that will inherit all the new
  properties.
- parent - (_object_) The object provide all the properties.

## Method: merge

A recursive merge of objects together, using clones for objects and
arrays.

### Syntax

	var obj = merge(source, objects...);

## Method: clone

## Method: create

## Method: forEach

## Method: map

## Method: some

## Method: every

## Method: toQueryString

# Module: array

## Method: from

## Method: flatten

# Module: string

## Method: uniqueID

## Method: capitalize

## Method: camelCase

## Method: hyphenate

## Method: parseQueryString

## Method: substitute

A helper method to format a string, by placing markers where
replacements should happen.

### Syntax

	var output = string.substitute(str, object);

### Arguments

- str - (_string_) A string with {markers} to be replaced.
- object - (_object_) An object with properties. The name of the markers
  will be matched with properties on the object. If the properties are a
  function, the function will be invoked and the return value will be
  used for replacement.

### Example

	var output = string.substitute('A {adj} example of {noun}', {
		adj: 'fine',
		noun: 'substitution'
	});
	output === 'A fine example of substitution';

# Module: function

## Method: noop

## Method: overloadSetter

## Method: overloadGetter

# Module: date

A utility module with date helpers.

## Method: format

Format a date according to the string provided. Uses syntax of
[string.substitute][].

### Syntax

	var output = date.format(str[, date]);

### Arguments

- str - (_string_) A string with {markers} in order to format the date.
- date - (_Date_, optional) A date to be used when formatting. If not
  provided, the current date will be used.

### Format Options

- a - short day ("Mon", "Tue")
- A - full day ("Monday")
- b - short month ("Jan", "Feb")
- B - full month ("January")
- c - the full date to string
- d - the date to two digits (01, 05, etc)
- H - the hour to two digits in military time (24 hr mode) (00, 11, 14, etc)
- I - the hour as a decimal number using a 12-hour clock (range 01 to 12).
- j - the day of the year to three digits (001 to 366, is Jan 1st)
- m - the numerical month to two digits (01 is Jan, 12 is Dec)
- M - the minutes to two digits (01, 40, 59)
- p - the current language equivalent of either AM or PM
- S - the seconds to two digits (01, 40, 59)
- w - the numerical day of the week, one digit (0 is Sunday, 1 is Monday)
- x - the date: {m}/{d}/{y}
- X - the time: {H}:{M}:{S}
- y - the short year (two digits; "07")
- Y - the full year (four digits; "2007")

### Example

	date.format('{a} at {I}:{M}{p}'); // 'Tue at 02:14PM'

[string.substitute]: #string:substitute

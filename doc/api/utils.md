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



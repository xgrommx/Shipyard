# Class: Observable

A class with a get/set interface that makes it easy to manipulate data
on an object allowing others to observe all or only specific changes.

### Extends

[EventEmitter](./events.md#EventEmitter)

## Method: set

Set a property that will trigger a change event if the value is
different.

### Syntax

	observable.set(property, value);
	observable.set(properties);

### Arguments

- Two arguments (property, value)
    - property - (_string_) A key corresponding to the same name of one
      of the model's `fields`.
    - value - (_mixed_) The value to set for the speific field.
- One argument (properties)
    - properties - (_object_) An object of key-value pairs that work
      like calling `set` with each pair individually as the two-argument
      path.

### Returns

- (object) This Observable instance.

## Method: get

Retrieve a value from the object. This allows computed properties to
work seemlessly.

### Syntax

	var value = observable.get(keyOrKeys);

### Arguments

- keyOrKeys - (_string or array_) A string or array of strings of
  properties to return the value of.

### Returns

- (_string or array_) The value of the property requested, or an array of the values
  if an array was passed as an argument.

## Method: observe

Specify a function that should be called when the observed property
changes. A shortcut for listening to change events for only a specific
property.

### Syntax

	observable.observe(property, callback);

### Arguments

- property - (_string_) The property name to observe.
- callback - (_function_) The function to execute when the property
  changes. It will be passed as arguments the new value, and the old
  value: `function (newVal, oldVal) {}`


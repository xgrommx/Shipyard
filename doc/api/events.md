# Class: EventEmitter

A class to allow object to listen for certain events, and the
implementor of this class can emit those events at various times.
Models, Views, and Controllers are EventEmitters. Use by doing this:

	var EventEmitter = require('shipyard/class/Events');

## Method: emit

This emits an event, invoking any listeners interested.

### Syntax

	emitter.emit(eventName [, args...]);

### Arguments

- eventName - (_string_) A string representing the event that happened.
- args - (_mixed_, optional) Any number of extra arguments that will be
  passed to all listener functions.

### Returns

- (_object_) This emitter.

### Example

	model.emit('save', isNew);

## Method: addListener

They way to listen for specific events.

### Syntax

	var listener = emitter.addListener(eventName, handler);

### Arguments

- eventName - (_string_) A string represting the event you wish to
  listen for.
- handler - (_function_) The function that should be called when the
  event is emitted.

### Returns

- (_Listener_) A new `Listener` object.

## Method: removeListener

A way to remove listeners if you still have the original handler method.

### Syntax

	emitter.removeListener(eventName, handler);

### Arguments

- eventName - (_string_) A string representing the event that should not
  longer be listened for.
- handler - (_function_) The exact function has been previously added as
  a handler for the `eventName`

### Returns

- (_object_) This emitter.

# Class: Listener

Listeners are a simple way to add and remove the same handler at various
times, and may be easier to hold on to than an anonymous function.

## Method: attach

The handler associated with this Listener will be added to the
associated event.

### Syntax

	listener.attach();

## Method: detach

The handler associated with this Listener will be removed from the
associated event.

### Syntax

	listener.detach();

### Example

	var listener = emitter.addListener('change', function() {
		alert('changed!');	
	});

	// useful since you didn't keep a reference to the anonymous
	// function passed as the handler above.
	listener.detach();

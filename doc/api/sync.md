# Class: Sync

A base class that all Sync's should extend from.

### Syntax

	var sync = new Sync([options]);


# Class BrowserSync

A sync to read and write to the `localStorage` of the browser.

### Extends

Sync

### Options

- table - (_string_) A string key to store all the rows of data inside
  localStorage.

# Class: ServerSync

A sync to access a RESTful API using XMLHttpRequests.

### Extends

Sync

### Options

- route - (_string_) The route leading to the API for this specific
  model.
- emulation - (_boolean_) Whether to emulate `PUT` and `DELETE` requests
  as `POST`, passing `_method=PUT` as a parameter instead. Useful for
  servers that don't support `PUT` or `DELETE`.
- create, update, read, destroy - (_object_, optional) An object of
  options specific for each type of request.
	- fragment - (_string_, optional) Added to the URI before the
	  request is made. Uses syntax from `string.substitute`.
	- method - (_string_, optional) The HTTP method to use.

### Example

	Sync: {
		'default': {
			driver: ServerSync,
			route: '/api/tasks',
			update: {
				fragment: '/{guid}/{name}'
			}
		}
	}

# Class: Syncable

A Syncable object has a unified API for saving, reading, and destroying
data to various locations. The most common usage is with a `Model`.

## Method: save

Saves a JSON representation of the object to a sync. Uses the objects
toJSON method, if available.

### Syntax

	syncable.save([options]);

### Arguments

- options - (_object_, optional) An object of options for the save
  operation.

### Options

- using - (_string_, optional) The string matching a sync from the
  object's Sync property. Defaults to 'default'.

## Method: destroy

Tells a sync to delete the stored content of this syncable.

### Syntax

	syncable.destroy([options]);

### Arguments

- options - (_object_, optional) An object of options for the destroy
  operation.

### Options

- using - (_string_, optional) The string matching a sync from the
  object's Sync property. Defaults to 'default'.

## Static Method: find

Searches a sync for all data of the Syncable type that matches the
provide criteria.

### Syntax

	Syncable.find([options]);

### Arguments

- options - (_object_, optional) An object of options for the destroy
  operation.

### Options

- conditions - (_object_, optional) An object containing conditions for
  the found data.
- using - (_string_, optional) The string matching a sync from the
  object's Sync property.
- callback - (_function_, optional) A function that will be called once
  the sync has returned data. The callback will be passed an array of
  instances of the Syncable as a parameter.

### Example

	Task.find({
		conditions: { isDone: false },
		using: 'server',
		callback: renderTasks
	});

## Note

A Syncable class is also an EventEmitter. It is specially modified so
that one can listen to events on the Class, to retrieve all events that
are emitted on all instances.

### Example

	Task.addListener('save', function(instance, isNew) {
		console.log(instance);
	});
	var t = new Task();
	task.save(); // will log the instance to the console

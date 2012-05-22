# Class: Sync

A base class that all Sync's should extend from.

### Syntax

	var sync = new Sync([options]);

## Method: create

Creates new data in the sync location.

### Syntax

	sync.create(data, callback);

### Arguments

- data - (_object_) The data of the model. This should get serialized
  via `JSON.stringify`.
- callback - (_function_) A function to execute after a successful
  creation operation. Expects an object of data representing the entire
  model as an argument.

## Method: update

Updates existing data in the sync.

### Syntax

	sync.update(id, data, callback);

### Arguments

- id (_mixed_) A string or number id of the content to update.
- data (_object_) The data of the model. This should get serialize via
  `JSON.stringify`.
- callback - (_function_) A function to execute after a successful
  update operation. Expects an object of data representing the entire
  model as an argument.

## Method: read

Reads data from the sync and returns it, based on the provided criteria.

### Syntax

	sync.read(params, callback);

### Arguments

- params - (_object_) A key-value map of conditions that the returns
  data must pass.
- callback - (_function_) A function to execute after a successful read
  operation. Expects an array of objects of data that met the criteria.

### Example

	sync.read({ isDone: false, user_id: 5 }, function(arr) {
		arr.forEach(function (obj) {
		
		})
	});


## Method: destroy

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

### Extends

Observable

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

### Returns

- ([ObservableArray][]) An array that will be filled in with the results
  as they are received.

### Example

	var tasks = Task.find({
		conditions: { isDone: false },
		using: 'server'
	});
	listView.set('content', tasks);

## Note

A Syncable class is also itself an EventEmitter. It is specially modified so
that one can listen to events on the Class, to retrieve all events that
are emitted on all instances.

### Example

	Task.addListener('save', function(instance, isNew) {
		console.log(instance);
	});
	var t = new Task();
	task.save(); // will log the instance to the console

[ObservableArray]: ./observable-array.md#ObservableArray

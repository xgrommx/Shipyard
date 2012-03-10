# Class: Model

Models represent the actual data that an application will be using. 
Models also abstract away the specifics of where the data is stored.
Whether you store the data on a server and need Ajax requests to fetch
it, or you store it in the local SQLite database, the public API for 
Models stays the same, so the rest of your application can blissfully
ignorant.

### Extends

[Syncable](./sync.md#Syncable)

## Mutator: fields

This property is an object of fields that describe the data of your
Model, using [Field][] classes.

### Syntax

	var Task = new Class({
		Extends: Model,
		fields: {
			title: fields.TextField(),
			created_at: fields.DateField(),
			is_done: fields.BooleanField()
		}	
	});

## Mutator: Sync

This is an object of names and [syncs](./sync.md#Sync) that the data of 
this model should synchronize to.

### Syntax

	var Task = new Class({
		Extends: Model,
		Sync: {
			'default': BrowserSync,
			'our_server': {
				driver: ServerSync,
				route: '/api/1/tasks'
			}
		}
	})

## Method: constructor

### Syntax

    var model = new Model([data]);

### Arguments

1. data - (_object_, optional) An object of key-value pairs relating to
   the Model's `fields` for the initial data.

## Method: set

*Inherited from [Observable][]*. The way to assign values to fields the 
model has. Don't use direct assignment, or you'll miss out the 
usefulness from `Observable` and `fields`.

### Syntax

    model.set(arguments);

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

- (object) This Model instance.

### Examples

	var model = new Model();
	model.set('pk', 3);
	model.set({
		pk: 4,
		title: 'Example'
	});

## Method: get

*Inherited from [Observable][]*. The way to retrieve values of the fields
that the model has.

### Syntax

	var value = model.get(keyOrKeys);

### Arguments

- keyOrKeys - (_string or array_) A string or array of strings of
  properties to return the value of.

### Returns

- (_string or array_) The value of the field requested, or an array of the values
  if an array was passed as an argument.

## Method: save

*Inherited from [Syncable][]*.

## Method: destroy

*Inherited from [Syncable][]*.

## Method: observe

*Inherited from [Observable][]*

[Field]: ./fields.md#Field
[Syncable]: ./sync.md#Syncable
[Observable]: ./observable.md#Observable

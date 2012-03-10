Models
======

Many applications have data, and they want to store it or fetch it from
various locations. Shiyard [Models][Model] do a couple things that help
organize and make the common operations easier, using Fields and Syncs.

Fields
------

Part of writing Model classes is that it lets you easily define what
properties of data are relevant. With data coming from various
locations, such as the server, a JSONP request, or the user, it's best
to have a single place that deserializes the data and makes it useful
inside our application. For example, here's what the [DateField][] does:

	var Task = new Class({
		Extends: Model,
		fields: {
			createdAt: DateField()	
		}
	});

	// from the server, we receive data in JSON form, and the createdAt
	// info is the Unix timestamp.
	var task = new Task({ createdAt: 1331339351176 });

	// the DateField transforms it into a Date object for us
	task.get('createdAt'); // a Date object

	// and it will serialize to valid JSON again
	JSON.stringify(task); // { "createdAt": 1331339351176 }

This deserialization happens automatically, whenever a property is set.

Syncs
-----

Once you have your Model outlined with Fields, it's worth setting up
where you expect to fetch and save the data of this model. Shipyard uses
[Syncs][Sync] for this purpose. Syncs define a way to create, update,
read, and destroy data from a particular source. Shipyard currently has
2 syncs out of the box: 

- [BrowserSync][] that uses `localStorage`
- [ServerSync][] that uses a REST server.

### `Using` Syncs

A Model can specify multiple sync locations, and then easily pick which
one is needed later. Take this example:

	var Task = new Class({
		Extends: Model,
		Sync: {
			'default': {
				driver: ServerSync,
				route: '/api/tasks'
			},
			'local': {
				driver: BrowserSync,
				table: 'tasks'
			}
		}
	});

This `Task` model declares that the default place to find and save data
is a REST API located at `/api/tasks` from the website it is served on,
but can also sync to `localStorage`, for some minor offline
capabilities.

Then, specifically using each sync is a cinch. You can add a `using`
option with the name of the sync to use. If you don't pass one, the sync
you named "default" will be used automatically.

	Task.find({ callback: function(tasks) {
		// used "default" ServerSync
	}});

	// ... elsewhere, save a specific task to localStorage
	task.save({ using: 'local' });

[Model]: ../api/model.md#Model
[Sync]: ../api/sync.md#Sync
[BrowserSync]: ../api/sync.md#BrowserSync
[ServerSync]: ../api/sync.md#ServerSync
[DateField]: ../api/fields.md#DateField

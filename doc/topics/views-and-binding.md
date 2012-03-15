Views
=====

After you've defined your [data models][Models], it's worth thinking
about Shipyard's [View][] system. The goal of the view system is to let
a developer programmatically define the user interface once, and
whenever the underlying data changes, the views update automatically.

This is possible because Models and Views (and Controllers, for that
matter) are [Observable][].

Binding
-------

Views can provide an API to bind another Observable to it. This let's
you declare that a model's `title` field and the view's `content` field
should stay in sync.

	view.bind(model, {
		'content': 'title'
	});

	// later
	model.set('title', 'foo');
	// view's content automatically updated to 'foo' in the DOM

This way, you can setup the UI at the beginning, bind the views to the
data, and then write your application around how the data changes. You
never have to worry about remembering which views all depend on the
values you just changed; they'll automatically remember for you.


Computed Properties
-------------------

Any property on an [Observable][] can be a function, and if it is, it
will be invoked whenever `get` or `set` are called for that property.
You can also `observe` those properties like any other.

However, if those properties depend on others to compute their value,
there is a way to declare that so when a dependent property changes, the
[computed property][property] also changes.


[Models]: ./models.md#Models
[View]: ../api/views.md#View
[Observable]: ../api/observable.md#Observable
[property]: ../api/observable.md#Observable:property

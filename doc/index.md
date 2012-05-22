Shipyard
===========

Besides being [MVC][mvc] in JavaScript, Shipyard is __explictly
modular__, __easy to test__, and utilizes the power of __Syncs__ and
__View binding__.

Get it now!
-----------

Take a look at the [tutorial](./topics/tutorial.md) to make your first
application, or the [obligatory example Todo app][todo].

Then, install the latest stable version using `npm install shipyard`, or
grab the dev version from GitHub:

	$ git clone git://github.com/seanmonstar/Shipyard.git
	$ cd Shipyard
	$ npm link
	$ shipyard test

What is Shipyard?
-----------------

### Framework-wide Goals

1. __[Modularity][modules]__: Be able to declare dependencies inside the code, and not be bothered with managing them during development or deployment.
2. __[Testability][testing]__: Be easily testable, using a node test runner.
3. __[JavaScript][shipyard-cli]__: Not reliant on any other language. Build scripts will use JavaScript. The End.

### Model Goals

1. __[Fields][]__: Powerful fields come alive from simple JSON.
2. __[Sync][]__: Easily specify multiple locations the data should sync to.

### View Goals

1. __[Binding][view-binding]__: Views can automatically update themselves when related
   properties change in a Controller or Model.
2. __DRY__: Views are easily extendable.
3. __DOMs Away__: The DOM is a layer away. Instead, you get a nice
   interface, with contextual events.
4. __Templates__: The underlying layer of Views uses Templates to
   render, if you're a control freak.

### Controller Goals

1. __Boilerplate__: Attempt to remove typical boilerplate of attaching
   Models to Views with validation in between.

Meta
----

The code is [available on GitHub][source], the [test suite][ci] is
connected to TravisCI, and you can play with it on [jsFiddle][jsfiddle].

Bugs and feature requests live at [GitHub Issues][issues], and you can send tweets
to [@shipyardjs][twitter].

[testing]: ./topics/testing.md
[modules]: ./topics/modules.md
[shipyard-cli]: ./api/shipyard-cli.md
[Fields]: ./api/fields.md
[Sync]: ./api/sync.md
[view-binding]: ./topics/views-and-binding.md

[mvc]: http://en.wikipedia.org/wiki/Model%E2%80%93view]E2%80%93controller
[todo]: /Shipyard/examples/tasks/
[source]: https://github.com/seanmonstar/Shipyard
[ci]: http://travis-ci.org/#!/seanmonstar/Shipyard
[jsfiddle]: http://jsfiddle.net/seanmonstar/JrcF4/
[issues]: https://github.com/seanmonstar/Shipyard/issues
[twitter]: https://twitter.com/shipyardjs

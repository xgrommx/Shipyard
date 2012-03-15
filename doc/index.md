Shipyard
===========

A Javascript [MVC][mvc] application framework. For when you have a full-on application sitting on a web page. So much is going on, you should be able to focus on making the application working, not worrying about XmlHttpRequests and the DOM.

What Shipyard is
--------------

An application framework that covers all the common things any JavaScript application would need to deal with: interacting with a server, storing data, rendering said data in the browser, and responding to user actions. An application built on Shipyard should only have to write that pulls all those things together.

If you're application is going to have 1000 lines of JavaScript, would you rather write all those yourself, or have 900 of them be in a framework that is tested and used by others?

When starting a web application, you would reach for Django, or CakePHP, or Rails; never would you decide to use just the language itself. Why shouldn't you do the same when the target language is JavaScript?

Goals
-----

### Framework-wide Goals

1. __Modularity__: Be able to declare dependencies inside the code, and not be bothered with managing them during development or deployment.
2. __Testability__: Be easily testable, using a node test runner.
3. __JavaScript__: Not reliant on any other language. Build scripts will use JavaScript. The End.

### Model Goals

1. __Fields__: Powerful fields come alive from simple JSON.
2. __Sync__: Easily specify multiple locations the data should sync to.

### View Goals

1. __Binding__: Views can automatically update themselves when related
   properties change in a Controller or Model.
2. __DRY__: Views are easily extendable.
3. __DOMs Away__: The DOM is a layer away. Instead, you get a nice
   interface, with contextual events.
4. __Templates__: The underlying layer of Views uses Templates to
   render, if you're a control freak.

### Controller Goals

1. __Boilerplate__: Attempt to remove typical boilerplate of attaching
   Models to Views with validation in between.

Getting Started
---------------

	$ git clone git://github.com/seanmonstar/Shipyard.git
	$ cd Shipyard
	$ npm link
	$ shipyard test

Take a look at the [tutorial](./topics/tutorial.md) to make your first
application, or the [obligatory example Todo app][todo].

[mvc]: http://en.wikipedia.org/wiki/Model%E2%80%93view]E2%80%93controller
[todo]: /Shipyard/examples/tasks/

# Class: Class

Class is a useful construct for describing your classes, using
JavaScript's prototypical inheritance, while removing some of the
verbosity.

Classes have Mutators, which are ways to modify a class when it is
created. The most common Mutator used is `Extends`.

## Mutator: Extends

Extends lets you declare sub-classes. This sets the prototype of the
Class you are defining as being related to the super-class, and will
look up the prototype chain for methods. This means that if the
super-class gets modified later in the application, the sub-classes
automatically are as well.

### Example

	var Task = new Class({
		Extends: Model
	});

## Mutator: Implements

Implements is the same thing as a Mixin. JavaScript can't do
multiple-inheritance, so a Class can only Extend one other class.
However, sometimes you have a self contained set of methods that you
would like easily pluggable into other classes. That is what Implements
is for.

A common class to Implement is the `EventEmitter` class.

### Example

	var Arbiter = new Class({
		Implements: [Observable, Syncable]
	});

## Method: parent

This a way to access the `super` method when the `Extends` Mutator is
used.

### Example

	var A = new Class({
		getAge: function() { 
			return 2; 
		}
	});

	var B = new Class({
		Extends: A,
		getAge: function() {
			return this.parent() * 3;
		}	
	});

	var b = new B();
	b.getAge(); // 6

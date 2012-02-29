# Class: View

A View is an abstract way of showing data to a user on the screen. The
DOM can be confusing and unintuitive, so the View layer allows
developers to work without touching the DOM. Potentially, it also allows
developers to create their application using the View api, and modify
the internals to use a different technology, such as XUL, SVG, or
Canvas, without the application needing to change it's code.

Views use templates to render their internals, which means that a user
can provide their own templates if they needed to drastically change the
way Views rendered.

Views have a binding interface, which allows them to bind to an
`Observable`, such as a `Model`, and automatically update themselves
when the `Observable`'s properties change.

### Extends

Observable

### Usage

	var View = require('shipyard/view/View');

## Method: constructor

### Syntax

	var view = new View([options]);

### Arguments

- options - (_object_, optional) An object of options that match
  properties of the View.

### Examples

	var label = new View({
		id: 'radical-label',
		content: 'Hello World'
	});

## Method: set

_Inherited from Observable_

## Method: get

_Inherited from Observable_

## Method: bind

Binds another `Observable` to properties of this View.

### Syntax

	view.bind(observable, properties);

### Arguments

- observable - (_Observable_) An Observable instance whose data should
  be bound to the View.
- properties - (_object_) An object map of properties from the
  observable that should update the view.

### Example

	view.bind(user, {
		'content': 'username',
		'class': 'isStaff'
	});

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

[Observable][]

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

_Inherited from [Observable][]_

## Method: get

_Inherited from [Observable][]_

## Method: attach

Attaches the View to the DOM, rendering it.

### Syntax

	view.attach();

# Class: Container

A View that have child views.

### Extends

[View][]

## Method: addView

Adds a View as a child of this View.

### Syntax

	container.addView(view);

### Arguments

- view - (_View_) The view to be adopted. Can be any view, including
  another container with it's own children.

## Method: removeView

Removes the View from being one of its children.

### Syntax

	container.removeView(view);

### Arguments

- view - (_View_) A view that is already a child view of the Container,
  that should no longer be.

# Class: CollectionView

A Container that renders a list of data with the same child views.
Mostly an abstract class meant for extending.

### Extends

[Container][]

## Method: addItem

Add an item to the collection, creating another child view
automatically.

### Syntax

	collectionView.addItem(item);

### Arguments

- item - (_mixed_) Any value that should be passed as content to the new
  child view.

## Method: removeItem

Remove an item from the collection, and its corresponding child view.

### Syntax

	collectionView.removeItem(item);

### Arguments

- item - (_mixed_) A value already part of the collection that should be
  removed.

# Class: FormView

A container to hold form controls.

### Extends

[Container][]

# Class: ButtonView

# Class: CheckboxView

# Class: TextFieldView

# Class: TextAreaView

# Class: ListView

A CollectionView that will create a `ul` with `li` child views.

### Extends

[CollectionView][]

[Observable]: ./observable.md#Observable
[View]: #View
[Container]: #Container
[CollectionView]: #CollectionView

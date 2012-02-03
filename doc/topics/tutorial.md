Your First Shipyard App
=====================

Let's learn by example. We'll walk through creating a basic recipe
collection. We'll assume you already have [Shipyard installed][1]. You can
tell it's installed correctly by running `shipyard` in a terminal and
seeing the help information printing.

Setup your project
-----------------

Shipyard comes with a utilty to get started with a new application very
quickly. In a terminal, get to the directory that you would like your
application to live, and run this:

	$ shipyard startapp recipes

This will create a directory called `recipes`, as well as some typical
files used in an application. You should see a file structure like so:

	recipes/
		models/
			Recipe.js
		tests/
			models/
				Recipe.js
		views/
		index.html
		index.js
		package.json

`cd` into the directory, and you can immediately run the tests to see
how that works.

	$ cd recipes
	$ shipyard test
	Starting Tests
	.
	Tests Finished: Passed (Passed: 1, Failed: 0)


Edit Recipe Model
-----------

Now, since Shipyard applications are data-driven, let's edit the Recipe
Model that got generated for us. We'll add some properties that make
sense for a Recipe, such as a title, and ingredients. Edit the file to
add these lines in:

	module.exports = new Class({
	
		// ...

		fields: {
			id: fields.NumberField(),
			title: fields.TextField({ required: true }),
			ingredients: fields.TextField()
		},

		//...
	
	});

This Recipe class extends from Model, which among other things, uses a
`fields` properties to know what properties make up the underlying data.
The `id` is a `NumberField`, and `title` and `ingredients` are
`TextField`s. A field type will try to properly convert the data from
a JavaScript-usable form to a serializable form (for databases or
what-have-you) automatically.

`Field`s also accept options, and we've used one here to imply that the
`title` is required before the model could `save` properly.

These fields determine what values you can use via the Model's `get` and
`set` methods. Try these in a console:

	$ shipyard shell
	> var Recipe = require('./models/Recipe');
	> var r = new Recipe();
	> r.set('title', 'French Toast');
	> r.get('title') // should return 'French Toast'
	> r.set('oops', 'i did it again'); // won't set anything
	> r.get('yikes'); // throw an Error about an non-existant 'yikes'

While we're here editing the Model, it would be a good idea to set the
`toString` method to something more useful.

	toString: function toString() {
		return this.get('title');	
	}

Most views will default to showing the String representation of a Model
if a property isn't specified, so it's a good idea to set up a decent 
`toString` method.

A dip into testing
---------------

After having set up our Recipe model, go ahead and run the test suite
again:

	$ shipyard test
	Starting Tests
	F

	====================================================
	models: Recipe: should have a String representation
	----------------------------------------------------
		 1: Expected toBe [object Recipe], got undefined

	====================================================

	Tests Finished: Failed (Passed: 0, Failed: 1)

The single test that `shipyard startapp` creates by default is a simple
`toString` test meant to be overriden. Since we changed that method, we
should update our test so it passes.

Open up the `recipes/tests/models/Recipe.js` file, and modify the test
to have this:

	it('should have a String representation', function(expect) {
		var r = new Recipe();
		var title = 'French Toast';
		r.set('title', title);
		expect(String(r)).toBe(title);
	});

Another run of the test suite will show our test passes again. Hurray!

Creating Views
-----------

Until now, we've been playing with how to handle our data in models.
Let's get some stuff showing in the browser, right? Shipyard renders
data to the browser via it's View system.

First, we'll create a simple View that will show the title and
description of a single recipe. Edit the `recipes/index.js` file to look
like this:

	var View = require('shipyard/view/View');
	var Recipe = require('./models/Recipe');

	var toast = new Recipe({
		title: 'French Toast',
		ingredients: 'Bread, Egg, Milk'
	});

	var titleView = new View();
	titleView.bind(toast, { 'content': 'title' });
	titleView.attach();

We instantiated a `Recipe`, passing it initial properties with an object
map. Then we created a new basic `View`, and bound the `content`
property to the `title` property of our model. View binding means
whenever the model changes a property we care about, the view will
update immediately.

Check in Browser
--------------

In a terminal, run `shipyard server` from the `recipes` directory. Now,
you open your browser, point it at localhost:8000, and notice that
"French Toast" has been printed to the page.


Let's Make a Form
--------------

In order to create recipes, let's create a form that can be used to
accept user input, and then create new Recipes. Replace the contents of
index.js with something like this:

	var View = require('shipyard/view/View');
	var FormView = require('shipyard/view/FormView');
	var TextFieldView = require('shipyard/view/TextFieldView');
	var ButtonView = require('shipyard/view/ButtonView');
	var Recipe = require('./models/Recipe');

	var form = new FormView();

	var titleInput = new TextFieldView({ 
		name: 'title',
		placeholder: 'Recipe Title'
	});

	var ingredientsInput = new TextFieldView({
		name: 'ingredients',
		placeholder: 'Recipe ingredients'
	});

	form.addView(titleInput);
	form.addView(ingredientsInput);
	form.addView(new ButtonView({ content: 'New Recipe' }));
	form.attach();

So far, the only new concepts are that we used some new View classes,
specifically `FormView`, which is a `Container`. It can contain child
views, using a `addView` and `removeView` pair of methods.

A refresh of the browser shows our form, but it's not tied up to
anything. Time to make it useful.

A List of Recipes
------------

First of all, let's listen to the `FormView` to know when to save a new
`Recipe`. We can listen to the submit event like so:

	form.addListener('submit', function() {
		var data = this.serialize();
		var r = new Recipe(data);
		r.save();
	});

Next up, we'll make a `ListView` that will contain and show our recipes
as we create them. Add this to the index.js after the previous code we
wrote:

	var ListView = require('shipyard/view/ListView');
	var list = new ListView();
	list.attach();

And finally, we can listen for save events across any `Recipe` model
like this:

	Recipe.addListener('save', function(recipe, isNew) {
		if (isNew) {
			list.addItem(recipe);
		}
	});

Another refresh shows we have a list that fills up as we enter in
recipes and click the button.

Saving Data
-----------

The last bit to our tutorial is to show how easy it is to sync data to
various locations without changing our usage much. We're going to employ
a `Sync` to save to the browser's `localStorage`. In fact, we've been
using a `Dummy` sync this whole time, which let's our model act like it
can sync, without actually saving data anywhere.

Heading back to our `recipes/models/Recipe.js` file, we're going to edit
with these lines:

	// ... other requires ...
	var BrowserSync = require('shipyard/sync/Browser');

	module.exports = new Class({

		// ...

		Sync: {
			'default': {
				driver: BrowserSync	
			}
		}

		// ...

	});

The `Sync` property of a model should be an object map describing the
various locations the model should sync to. There should always be a
`default` sync, as shown. Any others should be named how you like, and
then can be accessed specifically be passing `{ using: 'yourSyncName'
}` to any Syncable method.

Back in our `index.js`, let's add in a line to load in our models on
page load:

	Recipe.find({ callback: function(recipes) {
		recipes.forEach(list.addItem.bind(list));
	}});

Save and refresh, then save a couple recipes. Then, you can refresh
again to see that they had been persisted.

Ahead full!
--------

With that quick overview, you now have an application working using
Shipyard. The concepts are the same as you scale to a full application,
but you can always read up more about specific parts if you like the
details.

[1]: ./installation

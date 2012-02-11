The DOM
=======

When programming with Shipyard, if you ever wish to access a usual
global that is available in a browser, such as `window`, `document`, or
`XMLHttpRequest`, you must access it via the `dom` module.

This is important, as it prevents other modules from relying on
environment globals that could not exist in other environments, such as
the node test runner, `shipyard test`. The `dom` relies on `jsdom` to
be able to provide the APIs you're looking for in the node environment,
that would otherwise be undefined if you blindly tried to just access
`document` globally.

An example:

	var dom = require('shipyard/dom');

	var el = new dom.Element('div');
	dom.document.body.appendChild(el);

However, if you think you need the `dom` to insert `Element`s,
consider using a `View` instead.


# Testing

One of the core tenets of Shipyard is that you should be able to easily
test your application. Specifically, right from the command line, even
if it involves the [DOM][].

With the built in [shipyard][] command, you can run tests for your app
in a few moments.

## Command Line

	shipyard test [tests...]

Shipyard will try to find the tests based on the current working
directory. If you specify why tests to run, it will only run those,
otherwise, it will run all it finds.

It knows where to look by the `test` property in your `package.json`
file. It should be a relative path to the directory containing all your
tests.

Example:

	{
		"shipyard": {
			"test": "./tests"
		}
	}

## API

Testing in Shipyard uses the [Testigo][] library, which provides a
Jasmine-like interface, but in nodejs form.

Here is an example of how a test module should looke like:

	module.exports = {
		'MyClass': function(it, setup) {
			setup('beforeEach', function() {});

			it('should be MyClass', function(expect) {
				var foo = new MyClass();

				expect(foo).toBeAnInstanceOf(MyClass);
			});
		}
	};

The module should export suites of tests, preferably grouped by
objective, and appropriately named. Each property exported by the module
should be a function, and it will be given `it` and `setup` functions.

`setup` is how you create `beforeEach`, `afterEach`, `before`, and
`after` scaffolding helpers.

`it` is how you define individual test cases. `it` takes a description,
and a function to be executed. Ideally, each `it` should describe and
test a single use case. That function receives the `expect` function.

`expect` is how you define assertions. Pass it a value you want to test,
and then call a method on the expectation.

Here all available expectations:

- toBe
- toEqual
- toBeType
- toBeAnInstanceOf
- toBeNull
- toBeUndefined
- toBeTrue
- toBeTruthy
- toBeFalse
- toBeFalsy
- toBeGreaterThan
- toBeLessThan
- toHaveMember
- toHaveProperty
- toHaveMethod
- toBeLike
- toBeSimilar
- toMatch
- toHaveBeenCalled

You may also access a `not` version of all these by accessing the `not`
property before calling an expectation.

	expect(arr.indexOf(val)).not.toBe(-1);

### Spy

The `toHaveBeenCalled` expectation requires a `Spy`, which is available
with `require('shipyard/test/Spy')`.

	var evts = new Events();
	var spy = new Spy();
	evts.addListener('foo', spy);
	evts.emit('foo', 'bar');

	expect(spy).toHaveBeenCalled();
	expect(spy.getCallCount()).toBe(1);
	expect(spy.getLastArgs()).toBeLike(['bar']);


[shipyard]: ../api/shipyard-cli.md
[DOM]: ./dom.md
[Testigo]: https://github.com/keeto/testigo

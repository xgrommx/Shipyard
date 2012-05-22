# shipyard

Shipyard comes with a command-line tool to easily manage your Shipyard
programming. It should be installed if you use `npm link` in the
Shipyard directory.

Of course, `shipyard --help` will show you help plus all available
options.

Many of these commands expect properties defined in the `package.json`
of your application. Specifically, they should all be defined on the
`shipyard` property, so as not to conflict with any `npm` properties.

## build

While developing, you can take advantage of Shipyard's `require.js`
script to make things easy. However, for production, that script is just
not acceptable. Since everyone already minifies their JavaScript anyways
(right?), Shipyard piggybacks and easily combines all your projects
files for you. It does this following all the `require`s.

Simply go to the directory of your application, and use this:

	shipyard build [destination]

### Options

- `--dir <name>` - Path to directory containing the app, if not
  currently in it.
- `-m, --minify` - Force the result to be minified. Ignores
  package.json property.
- `-M, --non-minify` - Force the result to not be minified. Ignores
  package.json property.

### package.json

- app - (_string_) Relative path to the file that starts your
  application.
- target - (_string_) Relative path of where the combined file should
  output, unless `destination` is passed to the command.
- mini_require - (_boolean_) Whether to include the mini require
  provided by Shipyard, or use your own. Default is false.
- min - (_boolean_) Whether to minify the result as well. Default is
  false.


## test

	shipyard test [testFiles]

[Testing your app][testing] should be a top priority. Shipyard tries to make that
really simple.

## server

	shipyard server

Will serve the current directory at `http://localhost:8000`, with
`/shipyard` paths automatically pulling in files from Shipyard.

## shell

	shipyard shell

Loads nodejs' REPL, but with Shipyard automatically pushed onto the path
for you, so you can do things like `require('shipyard/class/Class')`.


[testing]: ../topics/testing.md

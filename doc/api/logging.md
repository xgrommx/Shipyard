# Module: Logging

A logging module with the ability to extensively configure how your
entire application logs messages.

Logging in Shipyard is based on being able to easily use several
loggers, configure (or not) whether messages from certain loggers are
handled differently.

For example, you could want all log messages with level `WARN` and
higher to be logged to the console, as well as sent via `XMLHttpRequest`
to the server, so you can keep track of whenever the JavaScript client
is warning or erroring.

This logging module is inspired by [Python's logging module][Python], so if you
know that, you should be right at home here. The API is also largely the
same.

### Example

    var logging = require('shipyard/logging');
    log = logging.getLogger('myapp.mymodule');
    log.setLevel(logging.WARN);

    log.debug('This module has been loaded!'); // debug level is ignored
    log.error('This module should not be loaded'); // error message is logged


[Python]: http://docs.python.org/library/logging.html

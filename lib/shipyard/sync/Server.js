var Class = require('../class/Class'),
	Sync = require('./Sync'),
	Request = require('../http/Request'),
	assert = require('../error/assert'),
	object = require('../utils/object'),
	string = require('../utils/string');

module.exports = new Class({

	Extends: Sync,

	options: {
		emulation: false,
		route: '',
		// each method can overwrite the default options
		create: { fragment: '/', method: 'POST' },
		update: { fragment: '/{id}', method: 'POST' },
		read: { fragment: '/', method: 'GET' },
		destroy: { fragment: '/{id}', method: 'DELETE' }
	},

	create: function create(data, callback) {
		var opts = this.getOption('create');
		this._request({
			data: data,
			callback: callback,
			method: opts.method,
			url: this._url('create')
		});
	},

	update: function update(id, data, callback) {
		var opts = this.getOption('update');
		this._request({
			data: data,
			callback: callback,
			method: opts.method,
			url: this._url('update', {id: id})
		});
	},

	read: function read(params, callback) {
		var opts = this.getOption('read');
		this._request({
			data: params,
			callback: callback,
			method: opts.method,
			url: this._url('read')
		});
	},

	destroy: function destroy(id, callback) {
		var opts = this.getOption('destroy');
		this._request({
			callback: callback,
			method: opts.method,
			url: this._url('destroy', {id: id})
		});
	},

	_url: function(name, params) {
		// this needs to be able to b')ld a url based on a number of
		// different options:
		// 1. Easiest should be to declare a standard base route, ie:
		//		route: '/api/0/tasks'
		// 2. Add a fragment based on the `name` provided, ie:
		//		'update' => '/api/0/tasks/{id}'
		// 3. Optionally, each url for `name` could be completely
		//		different and described in `this.options`.
		var url,
			base = this.getOption('route'),
			opts = this.getOption(name);
		assert(opts, 'No request options for Sync action "' + name + '"');

		if (opts.route) {
			// 3.
			url = opts.route;
		} else {
			// 1.
			url = base + (opts.fragment || '');
		}

		return string.substitute(url, params);
	},

	_request: function(options) {
		var req = new Request({
			emulation: this.getOption('emulation'),
			url: options.url,
			method: options.method,
			data: options.data.toJSON(),
			onSuccess: function(text) {
				if (text && typeof options.callback === 'function') {
					options.callback(JSON.parse(text));
				}
			}
		}).send();
	}

});

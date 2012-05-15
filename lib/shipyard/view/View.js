var Class = require('../class/Class'),
    Observable = require('../class/Observable'),
    Binding = require('../class/Binding'),
    ViewMediator = require('./ViewMediator'),
    dom = require('../dom'),
    assert = require('../error/assert'),
    overloadSetter = require('../utils/function').overloadSetter,
    object = require('../utils/object'),
    type = require('../utils/type'),
    string = require('../utils/string'),
    log = require('../utils/log');

// ViewMediator translates DOM Events into events that fire on the
// Views, and bubble up parentViews.
var mediator = null;

/**
 *  View
 *
 *  View is a base class that handles rendering data from Models into
 *  HTML, and then emits events that make sense for each view. Views use
 *  a templating system to render themselves, allowing developers to
 *  override and completely customize the HTML of a View. However, the
 *  goal of the Shipyard View system is that most developers will no
 *  longer need to think about HTML at all.
 *
 *  ## Use
 *
 *      var View = require('shipyard/view/View');
 *
 *      var v = new View({
 *          content: 'Hello'
 *      });
 *
 */
var View = module.exports = new Class({

    Extends: Observable,
    
    parentView: null,

    tag: 'span',

    id: null,

    template: require('./templates/base.ejs'),

    content: null,

    element: null,

    _bindings: [],

    initialize: function View(options) {
        this.parent(options);
        this._setupVisibilityBinding();
        this._setupAttributeBindings();
        this._setupContentBinding();
        if (!this.get('id')) {
            this.set('id', string.uniqueID());
        }
        if (!mediator) {
            mediator = new ViewMediator(null, this.constructor.__classNames[0]);
        }
        mediator.registerView(this);
    },

    render: function render() {
        assert(type.isFunction(this.template),
            'View requires a template function to render.');
        this.emit('preRender');
        this.rendered = this.template(this, this.getRenderHelpers());
        delete this.element;
        this.emit('render');
        return this.rendered;
    },

    getRenderHelpers: function getRenderHelpers() {
        var attrs = this._getAttributesMap();
        return {
            escape: function(text) {
                return String(text)
                    .replace(/&(?!\w+;)/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            },
            attrs: function() {
                var buffer = [],
                    escape = this.escape;
                for (var attr in attrs) {
                    var val = attrs[attr];
                    if (val) {
                        if (typeof val === 'boolean') {
                            buffer.push(' '+attr+'="'+attr+'"');
                        } else {
                            buffer.push(' '+attr+'="'+escape(val)+'"');
                        }
                    }
                }
                return buffer.join('');
            }
        };
    },

    invalidate: function() {
        if (this.rendered) {
            var oldEl = this.toElement();
            this.render();
            this._createElement().replace(oldEl);
            oldEl.destroy();
        }
        return this;
    },

    // Bind lets us observe an object, update the view's
    // properties, and re-render
    bind: function(observable, map) {
        var binding = new Binding(this, observable, map);
        this._bindings.push(binding);
        object.forEach(map, function(from, to) {
            this.set(to, observable.get(from));
        }, this);
        return this;
    },

    attach: function attach(where) {
        if (this.parentView) {
            throw new Error('Cannot attach Views that have parentViews.');
        }
        
        where = where || dom.document.body;
        dom.$(where).appendChild(this);

        return this;
    },

    detach: function detach() {
        if (this.element) {
            this.element.destroy();
        }
        return this;
    },

    show: function show() {
        this.set('isVisible', true);
    },

    hide: function hide() {
        this.set('isVisible', false);
    },

    isVisible: true,

    _setupVisibilityBinding: function() {
        this.observe('isVisible', function(isVisible) {
            var el = this.get('element');
            if (el) {
                el.setStyle('display', isVisible ? '' : 'none');
            }
        });
    },
    
    _createElement: function _createElement() {
        if (!this.rendered) {
            this.render();
        }
        var temp = new dom.Element('div');
        temp.set('html', this.rendered);
        this.element = temp.getFirst();
        this.emit('elementCreated', this.element);
        return this.element;
    },

    toElement: function toElement() {
        if (!this.get('element')) {
            this._createElement();
        }
        return this.element;
    },

    toString: function toString() {
        return this.rendered || this.render();
        //return '[object View]';
    },

    __classNames: [],

    'class': function(cls) {
        if (arguments.length === 0) {
            // getter
            return this.constructor.__classNames.concat(this.__classNames).join(' ');
        } else {
            // setter
            this.__classNames.push(cls);
        }
    },

    _getAttributes: function _getAttributes() {
        var standardAttrs = ['id', 'class'];
        return standardAttrs.concat(this.constructor.__attributes);
    },

    _getAttributesMap: function _getAttributesMap() {
        var attrMap = {};
        var attrs = this._getAttributes();
        attrs.forEach(function(attr) {
            attrMap[attr] = this.get(attr);
        }, this);
        if (this.get('isVisible') === false) {
            attrMap.style = 'display:none;';
        }
        return attrMap;
    },

    _setupAttributeBindings: function _setupAttributeBindings() {
        var attrs = this._getAttributes();
        attrs.forEach(function observeAttr(attr) {
            this.observe(attr, function(value) {
                var el = this.get('element');
                if (el) {
                    el.set(attr, value);
                }
            });
        }, this);
    },

    _setupContentBinding: function _setupContentBinding() {
        this.observe('content', function() {
            // it would be easy to do element.set('text', content), but
            // with templates we don't know if the content should
            // actually go a couple elements deep.
            if (this.rendered) {
                this.invalidate();
            }
        });
    }

});


View.defineGetter('element', function() {
    if (this.parentView && this.parentView.get('element')) {
        this.element = dom.$(this.parentView).find('#'+ this.get('id'));
    }
    return this.element;
});

// Mutators
View.__attributes = [];
View.defineMutator('attributes', function(attrs) {
    assert(type.isString(attrs) || (attrs.every && attrs.every(type.isString)),
           'View.attributes must a string or Array of strings.');
    this.__attributes = this.__attributes.concat(attrs);
});

View.__classNames = ['shipyard-view'];
View.defineMutator('classNames', function(classes) {
    assert(type.isString(classes) || (classes.every && classes.every(type.isString)),
           'View.classNames must a string or Array of strings.');
    this.__classNames = this.__classNames.concat(classes);
});

var Class = require('../class/Class'),
    ObservableArray = require('../class/ObservableArray'),
    object = require('../utils/object'),
    View = require('./View'),
    Container = require('./Container'),
    property = Container.property;

var CollectionView = module.exports = new Class({

    Extends: Container,

    classNames: ['shipyard-collection'],

    // An ObservableArray of content
    content: null,

    emptyView: View,

    itemView: View,

    itemViewOptions: {
        tag: 'span'
    },

    initialize: function CollectionView(options) {
        this.parent(options);
        if (!this.get('content')) {
            this.set('content', []);
        }
    },

    isEmpty: property(function isEmpty() {
        var content = this.get('content');
        return !(content && content.length);
    }, 'content'),

    addItem: function addItem(item) {
        this.get('content').push(item);
        return this;
    },

    // Called by content.array observer
    _addItem: function _addItem(item, index) {
        var ViewClass = this.get('itemView');
        var options = this.get('itemViewOptions');
        options.content = item;
        var view = new ViewClass(options);
        delete options.content;
        this.addView(view, index);
        return this;
    },

    removeItem: function removeItem(item) {
        var content = this.get('content');
        var index = content.indexOf(item);
        if (index !== -1) {
            content.splice(index, 1);
        }
        return this;
    },

    // Called by content.array observer
    _removeItem: function _removeItem(item) {
        var view;
        for (var i = 0, len = this.childViews.length; i < len; i++) {
            if (this.childViews[i].get('content') === item) {
                view = this.childViews[i];
                break;
            }
        }

        if (view) {
            this.removeView(view);
        }
        return this;
    },

    _onContentChange: function _onContentChange(newVal, oldVal) {
        var view = this;
        var observeArrayDeeply = false;

        if (this[contentObsKey]) {
            this[contentObsKey].detach();
        }
        if (oldVal) {
            oldVal.forEach(function oldForEach(val, index) {
                view._onArrayChange(index, undefined, val);
            });
        }
        if (newVal) {
            this[contentObsKey] = newVal.observe('array', function() {
                view._onArrayChange.apply(view, arguments);
            }, observeArrayDeeply);
            newVal.forEach(function newForEach(val, index) {
                view._onArrayChange(index, val, undefined);
            });
        }
    },

    _onArrayChange: function _onArrayChange(index, newVal, oldVal) {
        // 3 paths
        // add, remove, and replace
        if (newVal && !oldVal) {
            //adding
            this._addItem(newVal);
        } else if (oldVal && !newVal) {
            //removing
            this._removeItem(oldVal);
        } else {
            //replacing
            this._removeItem(oldVal)._addItem(newVal, index);
        }
    },

    getRenderOptions: function getRenderOptions() {
        var opts = this.parent(),
            view = this;
        opts.isEmpty = function isEmpty() { return view.isEmpty(); };
        return opts;
    },

    _setupContentBinding: function noop() {
        //override from View, we don't want to invalidate when content
        //changes
    }

});

function observe() {
    CollectionView.prototype.observe.apply(CollectionView.prototype, arguments);
}

// Always attach an observer for content.array when content changes
var contentObsKey = '__collectionViewContentArrObs';
observe('content', CollectionView.prototype._onContentChange, false);

CollectionView.defineSetter('content', function(content) {
    if (content && !(content instanceof ObservableArray)) {
        content = new ObservableArray(content);
    }
    this.content = content;
});

CollectionView.defineSetter('itemViewOptions', function(options) {
    object.merge(this.itemViewOptions, options);
});
